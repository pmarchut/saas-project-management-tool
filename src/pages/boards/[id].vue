<script setup>
import { ref, toRefs } from 'vue';
const props = defineProps({
  id: String,
})

const { id: boardId } = toRefs(props);

const board = ref({
  id: boardId.value,
  title: "Let's have an amazing time at Vue.js Forge!!",
  order: JSON.stringify([
    { id: "1", title: "backlog", taskIds: [1, 2] }
  ])
})

const tasks = ref([
  { id: 1, title: "Code like amazing coder"},
  { id: 2, title: "Pushing some clean code"}
])

const updateBoard = (b) => {
  board.value = b;
}
</script>

<template>
  <div>
    <!-- <app-page-heading>
      {{ board.title }}
    </app-page-heading> -->

    <board-drag-and-drop :board="board" :tasks="tasks" @update="updateBoard" />

    <details>
      <pre>
        {{ board }}
      </pre>
    </details>
  </div>
</template>

<style scoped>
pre {
  width: 400px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
