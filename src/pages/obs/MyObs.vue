<template>
  <v-ons-page>
    <v-ons-pull-hook
      :action="doRefresh"
      @changestate="pullHookState = $event.state"
    >
      <span v-show="pullHookState === 'initial'"> Pull to refresh </span>
      <span v-show="pullHookState === 'preaction'"> Release </span>
      <span v-show="pullHookState === 'action'"> Loading... </span>
    </v-ons-pull-hook>
    <div>
      <div v-if="isDoingSync" class="updating-msg text-center">
        Synchronising with server
      </div>
      <no-records-msg v-if="isNoRecords" />
      <v-ons-list v-if="!isNoRecords">
        <v-ons-list-header
          v-if="isShowDeleteDetails"
          class="waiting-for-delete-header"
          >Waiting for network to delete
          <strong>{{ waitingForDeleteCount }}</strong> records
          <div v-if="isSyncDisabled">
            (Sync <span class="red">disabled</span> in settings)
          </div>
          <div v-if="deletesWithErrorCount">
            <span class="red">Error</span> while trying to delete
            <strong>{{ deletesWithErrorCount }}</strong> records on server,
            <strong class="red" @click="retryFailedDeletes">tap to retry</strong
            >.
          </div>
        </v-ons-list-header>
        <v-ons-list-header v-if="isWaitingForUpload"
          >Waiting to upload
          <span v-if="isSyncDisabled"
            >(Sync <span class="red">disabled</span> in settings)</span
          >
          <span v-if="!networkOnLine"
            >(Will retry when we're back online)</span
          ></v-ons-list-header
        >
        <obs-list
          :records="localRecords"
          key-prefix="waiting-"
          @item-click="push"
        />
        <v-ons-list-header v-if="isWaitingForUpload"
          >Uploaded</v-ons-list-header
        >
        <obs-list :records="remoteRecords" @item-click="push" />
      </v-ons-list>
    </div>
    <v-ons-fab position="bottom right" @click="onNewObsBtn">
      <v-ons-icon icon="md-plus"></v-ons-icon>
    </v-ons-fab>
    <v-ons-action-sheet :visible.sync="isNewObsActionsVisible" cancelable>
      <v-ons-action-sheet-button icon="fa-seedling" @click="onNewSingleSpecies"
        >Single species</v-ons-action-sheet-button
      >
      <!-- TODO support mapping records -->
      <v-ons-action-sheet-button
        v-if="!md"
        icon="fa-map-marked-alt"
        @click="isNewObsActionsVisible = false"
        >Cancel</v-ons-action-sheet-button
      >
    </v-ons-action-sheet>
  </v-ons-page>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  data() {
    return {
      isNewObsActionsVisible: false,
      pullHookState: 'initial',
    }
  },
  computed: {
    ...mapGetters(['isSyncDisabled']),
    ...mapGetters('auth', ['isUserLoggedIn']),
    ...mapState('ephemeral', ['networkOnLine']),
    ...mapGetters('obs', [
      'deletesWithErrorCount',
      'isDoingSync',
      'isRemoteObsStale',
      'localRecords',
      'remoteRecords',
      'waitingForDeleteCount',
    ]),
    isWaitingForUpload() {
      return (this.localRecords || []).length
    },
    isNoRecords() {
      return (this.remoteRecords || []).length === 0 && !this.isWaitingForUpload
    },
    isShowDeleteDetails() {
      return this.waitingForDeleteCount || this.deletesWithErrorCount
    },
  },
  mounted() {
    if (this.isRemoteObsStale) {
      this.doRefresh()
    }
  },
  methods: {
    push(obsId) {
      this.$router.push({ name: 'ObsDetail', params: { id: obsId } })
    },
    onNewObsBtn() {
      this.isNewObsActionsVisible = true
    },
    onNewSingleSpecies() {
      this.isNewObsActionsVisible = false
      this.$router.push({ name: 'ObsNewSingleSpecies' })
    },
    doRefresh(done) {
      if (this.isUserLoggedIn) {
        this.$store.dispatch('obs/refreshRemoteObs')
      }
      done && done()
    },
    retryFailedDeletes() {
      this.$store.dispatch('obs/retryFailedDeletes')
    },
  },
}
</script>

<style lang="scss" scoped>
@import '@/theme/variables.scss';
.wow-list-item {
  background-color: $wowLightLightBlue;
}

.updating-msg {
  background-color: #98ffc1;
  color: #555;
  padding: 0.25em;
  font-size: 0.9em;
}

.red {
  color: red;
}

.waiting-for-delete-header {
  background-color: #ffd384;
}
</style>
