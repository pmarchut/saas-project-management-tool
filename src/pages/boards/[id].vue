<script setup lang="ts">
import { ref, toRefs } from 'vue';
import { Button as KButton } from '@progress/kendo-vue-buttons';
import { Popup as KPopup } from '@progress/kendo-vue-popup';
const props = defineProps({
  id: String,
})

import type { Task } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const { id: boardId } = toRefs(props);

const board = ref({
  id: boardId?.value || "1",
  title: "Let's have an amazing time at Vue.js Forge!!",
  order: JSON.stringify([
    { id: "1", title: "backlog", taskIds: ["1", "2"] }
  ])
})

const tasks = ref<Partial<Task>[]>([
  { id: "1", title: "Code like amazing coder" },
  { id: "2", title: "Pushing some clean code" }
])

const showMenu = ref(false);

async function addTask(task: Task) {
  return new Promise((resolve, reject) => {
    const taskWithTheId = {
      ...task,
      id: uuidv4(),
    }
    tasks.value.push(taskWithTheId);
    resolve(taskWithTheId);
  });
}

const updateBoard = (b) => {
  board.value = b;
}
</script>

<template>
  <div class="flex items-start justify-between w-100 pt-8">
    <!-- <app-page-heading>
      {{ board.title }}
    </app-page-heading> -->

    <div>
      <board-drag-and-drop :board="board" :tasks="tasks" @update="updateBoard" :addTask="addTask" />

      <details>
        <pre>
          {{ board }}
        </pre>
      </details>
    </div>
    
    <KButton
      ref="button"
      :theme-color="'error'"
      :fill-mode="'outline'"
      :icon="'folder'"
      @click="showMenu = !showMenu"
    >Show Menu</KButton>
    <KPopup 
      :anchor="'button'" 
      :show="showMenu" 
      :popupClass="'board-popup'" 
      :anchorAlign="{ horizontal: 'right', vertical: 'bottom' }" 
      :popupAlign="{ horizontal: 'right', vertical: 'top' }">
      <KButton
        :theme-color="'error'"
        :fill-mode="'flat'"
        :icon="'trash'"
      >Delete Board</KButton>
    </KPopup>

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
<style>
.board-popup {
  padding: 1rem !important;
}
</style>
