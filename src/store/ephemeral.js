import { isNil } from 'lodash'

/**
 * A vuex module for anything that should NOT be saved to local storage.
 *
 * Put anything here that meets any of the following:
 *  - doesn't serialise well, like functions or references
 *  - shouldn't be saved between sessions, like "are we online" flag
 */

const state = {
  networkOnLine: true,
  refreshingApp: false,
  showAddToHomeScreenModalForApple: false,
  swReg: null, // current sw
  SWRegistrationForNewContent: null, // new, waiting sw
  isSplitterOpen: false,
  isForceShowLoginToast: false,
}

const mutations = {
  setNetworkOnline: (state, value) => (state.networkOnLine = value),
  setSWRegistrationForNewContent: (state, value) =>
    (state.SWRegistrationForNewContent = value),
  setShowAddToHomeScreenModalForApple: (state, value) =>
    (state.showAddToHomeScreenModalForApple = value),
  setRefreshingApp: (state, value) => (state.refreshingApp = value),
  setServiceWorkerRegistration: (state, value) => (state.swReg = value),
  toggleSplitter(state, shouldOpen) {
    if (typeof shouldOpen === 'boolean') {
      state.isSplitterOpen = shouldOpen
    } else {
      state.isSplitterOpen = !state.isSplitterOpen
    }
  },
  setForceShowLoginToast: (state, value) =>
    (state.isForceShowLoginToast = value),
}

const actions = {
  closeAddToHomeScreenModalForApple: async ({ commit }) => {
    localStorage.setItem('addToHomeIosPromptLastDate', Date.now())
    commit('setShowAddToHomeScreenModalForApple', false)
  },

  /**
   * Trigger service worker skipWating so the new service worker can take over.
   * This will also trigger a window refresh (see /src/misc/register-service-worker.js)
   */
  serviceWorkerSkipWaiting({ state, commit }) {
    if (isNil(state.SWRegistrationForNewContent)) {
      return
    }
    commit('setRefreshingApp', true)
    state.SWRegistrationForNewContent.waiting.postMessage('skipWaiting')
  },

  manualServiceWorkerUpdateCheck({ state }) {
    if (!state.swReg) {
      return false
    }
    state.swReg.update()
    return true
  },
}
const getters = {
  newContentAvailable: state => !isNil(state.SWRegistrationForNewContent),
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}
