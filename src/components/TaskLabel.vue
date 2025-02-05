<script lang="ts" setup>
defineProps<{
  value: string;
  color?: string;
}>()

defineEmits<{
  (e: "delete"): void
}>()
</script>

<template>
  <div 
    class="flex px-4 py-2 font-medium bg-gray-300 max-w-220px rounded text-white" 
    :style="`font-size: 1.2rem; background-color: ${color}`"
  >
    <span class="mr-2">🗹</span>
    <span class="flex-grow mr-2">
      {{ value }}
    </span>
    <button data-testid="clear-label" class="ml-auto" @click="$emit('delete')">
      🗑
    </button>
  </div>
</template>
