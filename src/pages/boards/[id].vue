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
const props = defineProps({
  id: String,
})

import type { Task } from "@/types";
import { v4 as uuidv4 } from "uuid";

const { id: boardId } = toRefs(props);

const { result, loading, onError } = useQuery(boardQuery, { 
  id: boardId?.value 
});
const board = computed(() => result.value?.board || {});
const tasks = computed<Partial<Task>[]>(() => []);

const showMenu = ref(false);

const alerts = useAlerts();
const router = useRouter();
const route = useRoute();

onError(() => alerts.error("Error loading board"));

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

const { mutate: updateBoard } = useMutation(updateBoardMutation, () => ({
  update(cache, { data: { boardUpdate } }) {
    cache.updateQuery({ query: boardQuery }, (res) => {
      //test
      console.log(boardUpdate);

      return {
        board: boardUpdate
      }
    });
  },
}));

const handleUpdateBoard = (b) => {
  updateBoard({ data: b });
}

const { 
  mutate: deleteBoard, 
  onError: onDeleteError, 
  loading: deleteLoading, 
} = useMutation(deleteBoardMutation, {
  update(cache, { data: { boardDelete } }, { variables }) {
    if (boardDelete.success) {
      cache.updateQuery({ query: boardsQuery }, (res) => ({
        boardsList: {
          items: res.boardsList.items.filter(
            (board) => board.id !== variables?.id
          ),
        },
      }));
    }
  },
});

onDeleteError(() => alerts.error("Error deleting board"));

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
    <!-- <app-page-heading>
      {{ board.title }}
    </app-page-heading> -->

    <div>
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
        @click="handleDeleteBoard(route.params.id as string)"
      >
        <template v-if="deleteLoading">
          <span class="k-icon k-i-spinner k-spin"></span> Deleting...
        </template>
        <template v-else>Delete Board</template>
      </KButton>
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
