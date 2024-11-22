<script setup lang="ts">
import { watch, reactive, toRaw } from 'vue';
import { cloneDeep } from 'lodash-es';
import draggable from 'vuedraggable';
import type { Board, Column, Task } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useAlerts } from '@/stores/alerts';
const alerts = useAlerts();

const props = defineProps<{
  board: Board;
  tasks: Task[];
  addTask(task: Partial<Task>): Task; 
}>();

// emits
const emit = defineEmits(["update"]);

const tasks = reactive(cloneDeep(props.tasks));
const board = reactive(cloneDeep(props.board));
const columns = reactive<Column[]>(JSON.parse(board.order as string));

const addColumn = () => {
  columns.push({ id: uuidv4(), title: "New column", taskIds: [] });
}

watch(columns, () => {
  emit(
    "update",
    cloneDeep({ ...props.board, order: JSON.stringify(toRaw(columns)) })
  );
});

async function addTask({ column, title } : { column: Column, title: string }) {
  const newTask = { title }
  try {
    const savedTask = await props.addTask(newTask);
    tasks.push({ ...savedTask })
    column.taskIds.push(savedTask.id);
  } catch {
    alerts.error("Error creating task!");
  }
}
</script>

<template>
  <button class="text-gray-500" @click="addColumn">New Column +</button>
  <div class="flex items-start py-12">
    <draggable 
      :list="columns" 
      group="columns" 
      item-key="id"
      class="flex flex-grow-0 flex-shrink-0 overflow-x-scroll"
    >
      <template #item="{ element: column }">
        <div class="column bg-gray-100 flex flex-col justify-between rounded-lg px-3 py-3 rounded mr-4 w-[300px]">
          <h2>{{ column.title }}</h2>
          <draggable 
            :list="column.taskIds" 
            group="tasks" 
            item-key="uid"
            :animation="200"
            ghost-class="ghost-card"
            class="min-h-[400px]"
          >
            <template #item="{ element: taskId }">
              <task-card
                v-if="tasks.find((t) => t.id === taskId)"
                :task="tasks.find((t) => t.id === taskId)"
                class="mt-3 cursor-move"
              ></task-card>
            </template>
          </draggable>
          <TaskCreator 
            @create="
              addTask({
                column,
                title: $event
              })
            " 
          />
        </div>
      </template>
    </draggable>
  </div>
</template>
