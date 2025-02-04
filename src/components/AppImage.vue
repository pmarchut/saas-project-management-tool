<script lang="ts" setup>
import { computed, toRefs } from 'vue';

const props = defineProps<{
  src: string;
}>()

const { src } = toRefs(props);

function toTwicpicsUrl(url: string) {
  return url.replace("https://cdn.filestackcontent.com/", "");
}

const twicpicsUrl = computed(() => {
  const url = toTwicpicsUrl(src.value);

  return url;
})
</script>

<template>
  <TwicImg :src="twicpicsUrl" ratio="none" />
</template>
