<script setup lang="ts">
import { ref, toRefs } from "vue";
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Popup as KPopup } from "@progress/kendo-vue-popup";
import deleteBoardMutation from "@/graphql/mutations/deleteBoard.mutation.gql";
import updateBoardMutation from "@/graphql/mutations/updateBoard.mutation.gql";
import boardsQuery from "@/graphql/queries/boards.query.gql";
import boardQuery from "@/graphql/queries/board.query.gql";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { useAlerts } from "@/stores/alerts";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
import { computed } from "vue";
import addTaskMutation from "../../graphql/mutations/addTask.mutation.gql";
const props = defineProps({
  id: String,
})

import type { Board, Task } from "@/types";
import { v4 as uuidv4 } from "uuid";

const { id: boardId } = toRefs(props);

const { result, loading, onError } = useQuery(boardQuery, { 
  id: boardId?.value 
});
const board = computed(() => 
  result.value?.board 
    ? { ...result.value.board, tasks: result.value.board.tasks?.items } 
    : {}
);
const tasks = computed<Partial<Task>[]>(
  () => result.value?.board?.tasks?.items || []
);

const showMenu = ref(false);

const alerts = useAlerts();
const router = useRouter();
const route = useRoute();

onError(() => alerts.error("Error loading board"));

const { mutate: createTaskOnBoard, onDone: onDoneCreatingTask, onError: onErrorCreatingTask } = useMutation(addTaskMutation);

async function addTask(task: Task) {
  const res = await createTaskOnBoard({
    boardId: boardId?.value,
    ...task
  })

  return res?.data?.boardUpdate?.tasks?.items[0];
}

onErrorCreatingTask((error) => {
  console.error(error);
  alerts.error(`Error adding task to board: ${error}`);
})

onDoneCreatingTask((res) => {
  alerts.success("You added a new task");
})

const { 
  mutate: updateBoard, 
  loading: loadingUpdateBoard, 
  onDone: onUpdateBoardDone 
} = useMutation(updateBoardMutation, () => ({
  update(cache, { data: { boardUpdate } }) {
    cache.updateQuery({ query: boardQuery }, (res) => ({
      board: boardUpdate
    }));
  },
}));

onUpdateBoardDone(() => {
  alerts.success("You updated a board");
})

const handleUpdateBoard = (b: Partial<Board>) => {
  updateBoard({ 
    data: { 
      ...b,
      id: boardId?.value, 
      tasks: b.tasks 
        ? { update: b.tasks?.map((task) => ({ data: task })) } 
        : undefined 
    }, 
  });
}

const handleUpdateTask = (t: Partial<Task>) => {
  updateBoard({ 
    data: { 
      id: boardId?.value, 
      tasks: { 
        update: tasks.value
          .map((task) => (task.id === t.id ? { ...task, ...t } : task))
          .map((task) => ({ data: task }))
      }
    }, 
  });
}

const { 
  mutate: deleteBoard, 
  onError: onDeleteError, 
  loading: deleteLoading, 
} = useMutation(deleteBoardMutation, {
  update(cache, { data: { boardDelete } }, { variables }) {
    if (boardDelete.success) {
      cache.updateQuery({ query: boardsQuery }, (res) => {
        if (res?.boardsList)
          return {
            boardsList: {
              items: res.boardsList.items.filter(
                (board) => board.id !== variables?.id
              ),
            },
          }
      });
    }
  },
});

onDeleteError((error) => {
  console.error(error);
  alerts.error("Error deleting board");
});

// Funkcja do usuwania tablicy
const handleDeleteBoard = async (boardId: string) => {
  try {
    const result = await deleteBoard({ id: boardId });

    if (result?.data.boardDelete?.success) {
      alerts.success(`Board with ID ${boardId} deleted successfully.`);
      router.push("/boards");
    }
  } catch (error) {
    console.error("Error deleting board:", error);
  }
};
</script>

<template>
  <p v-if="loading">Loading...</p>
  <div v-else class="flex items-start justify-between w-100 pt-8">
    <div>
      <app-page-heading>
        <input 
          type="text" 
          :value="board.title"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
          @blur="
            handleUpdateBoard({ 
              title: ($event.target as HTMLInputElement).value 
            })
          "
        />
      </app-page-heading>
    
      <board-drag-and-drop :board="board" :tasks="tasks" @update="handleUpdateBoard" :addTask="addTask" />

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
        :disabled="deleteLoading"
        @click="handleDeleteBoard(route.params.id as string)"
      >
        <template v-if="deleteLoading">
          <span class="k-icon k-i-spinner k-spin"></span> Deleting...
        </template>
        <template v-else>Delete Board</template>
      </KButton>
    </KPopup>

    <RouterView 
      :loading-update-task="loadingUpdateBoard"
      @updateTask="handleUpdateTask" 
      @close="router.push(`/boards/${route.params.id}`)" 
    />
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
