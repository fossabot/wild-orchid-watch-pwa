<template>
  <v-autocomplete
    :items="items"
    v-model="item"
    :get-label="getLabel"
    :component-item="template"
    :input-attrs="inputAttrs"
    @update-items="updateItems"
    @focus="onFocus"
  >
  </v-autocomplete>
</template>

<script>
import ItemTemplate from '@/partials/WowAutocompleteItem'
export default {
  name: 'WowAutocomplete',
  data() {
    return {
      item: null,
      items: [],
      template: ItemTemplate,
      inputAttrs: {
        placeholder: 'e.g. snail orchid',
      },
    }
  },
  methods: {
    getLabel(item) {
      if (!item) {
        return null
      }
      const isForced = item.id === 0
      if (isForced) {
        return item.rawValue
      }
      return item.name
    },
    updateItems(text) {
      this.yourGetItemsMethod(text).then(response => {
        this.items = response
      })
    },
    async yourGetItemsMethod(text) {
      if (!text) {
        return []
      }
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(e => ({
        id: e,
        name: text + e,
        description: 'some desc for ' + text + ' ' + e,
      }))
      return [{ id: 0, name: `Use "${text}"`, rawValue: text }, ...items]
    },
    onFocus() {
      // FIXME scroll input to top-ish of page, something like
      // const pc = document.getElementsByClassName('page__content')[0] // a ref would be better
      // const theInput = ... (needs a ref or something)
      // pc.scrollTo(0, theInput.getBoundingClientRect().top - pc.getBoundingClientRect().top)
    },
  },
}
</script>

<style lang="scss">
.v-autocomplete {
  .v-autocomplete-input-group {
    .v-autocomplete-input {
      font-size: 1.5em;
      padding: 10px 8px 3px;
      box-shadow: none;
      border: none;
      border-bottom: 1px solid #ccc;
      width: 90vw;
      outline: none;
      margin-bottom: 0.5em;
    }
  }

  .v-autocomplete-list {
    z-index: 99;
    width: 100%;
    text-align: left;
    border: none;
    border-top: none;
    max-height: 400px;
    overflow-y: auto;
    border-bottom: 1px solid #157977;
  }

  .v-autocomplete-list {
    .v-autocomplete-list-item {
      cursor: pointer;
      background-color: #fff;
      padding: 10px;
      border-bottom: 1px solid #157977;
      border-left: 1px solid #157977;
      border-right: 1px solid #157977;

      abbr {
        opacity: 0.8;
        font-size: 0.8em;
        display: block;
        font-family: sans-serif;
      }
    }

    .v-autocomplete-list-item:last-child {
      border-bottom: none;
    }

    .v-autocomplete-list-item:hover {
      background-color: #eee;
    }
  }
}
</style>
