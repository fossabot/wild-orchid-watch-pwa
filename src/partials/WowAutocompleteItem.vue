<template>
  <div>
    <span>{{ item.name }}</span>
    <abbr>{{ item.description }}</abbr>
  </div>
</template>

<script>
export default {
  name: 'WowAutocompleteItem',
  props: {
    item: { required: true },
    searchText: { required: true },
  },
}
</script>
