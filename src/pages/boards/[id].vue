<script setup lang="ts">
import { toRefs, ref } from "vue";
import deleteBoardMutation from "@/graphql/mutations/deleteBoard.mutation.gql";
import deleteLabelMutation from "@/graphql/mutations/deleteLabel.mutation.gql";
import updateBoardMutation from "@/graphql/mutations/updateBoard.mutation.gql";
import updateLabelMutation from "@/graphql/mutations/updateLabel.mutation.gql";
import boardsQuery from "@/graphql/queries/boards.query.gql";
import labelsQuery from "@/graphql/queries/labels.query.gql";
import boardQuery from "@/graphql/queries/board.query.gql";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { useAlerts } from "@/stores/alerts";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
import { computed } from "vue";
import addTaskMutation from "@/graphql/mutations/addTask.mutation.gql";
import createLabelMutation from "@/graphql/mutations/createLabel.mutation.gql";
const props = defineProps({
  id: String,
})

import type { Board, Task, Label } from "@/types";

const idUser = localStorage.getItem("id_user");
const { id: boardId } = toRefs(props);

const alerts = useAlerts();
const router = useRouter();
const route = useRoute();

const { result, loading, onError } = useQuery(boardQuery, { 
  id: boardId?.value 
});
onError(() => alerts.error("Error loading board"));
const { 
  result: labelsResult,
  loading: labelsLoading,
  onError: onLabelsError
} = useQuery(labelsQuery);
onLabelsError(() => alerts.error("Error loading labels"));

const board = computed(() => 
  result.value?.board 
    ? { ...result.value.board, tasks: result.value.board.tasks?.items } 
    : {}
);
const tasks = computed<Partial<Task>[]>(
  () => result.value?.board?.tasks?.items || []
);
const labels = computed<Partial<Label>[]>(
  () => labelsResult.value?.labelsList?.items || []
);
const selectedLabels = computed<Partial<Label>[]>(
  () => result.value?.board?.labels?.items || []
);

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

const { mutate: createLabel, loading: createLabelLoading } = useMutation(
  createLabelMutation, 
  () => ({
    update(cache, { data: { labelCreate } }) {
      cache.updateQuery({ query: labelsQuery }, (res) => ({
        labelsList: {
          items: [...res.labelsList.items, labelCreate],
        },
      }));
    },
  })
);
async function handleLabelCreate(label: Partial<Label>) {
  //test
  //console.log(label);
  await createLabel({ data: label });
  alerts.success("New Label Created!");
}

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
      tasks: b.tasks 
        ? { update: b.tasks?.map((task) => ({ data: task })) } 
        : undefined,
      labels: undefined,
    }, 
    filter: { id: boardId?.value },
  });
}
const handleUpdateTask = (t: Partial<Task>) => {
  updateBoard({ 
    data: { 
      tasks: { 
        update: {
          data: t,
          filter: { id: t.id }
        }
      }
    },
    filter: { id: boardId?.value }, 
  });
}

const loadingLabelId = ref<string | null>(null);
const { mutate: updateLabel } = useMutation(updateLabelMutation, () => ({
  update(cache, { data: { labelUpdate } }, { variables }) {
    cache.updateQuery({ query: labelsQuery }, (res) => {
      if (res?.labelsList)
        return {
          labelsList: {
            items: res.labelsList.items.map((label: Partial<Label>) => 
              label.id !== variables?.data.id ? label : labelUpdate
            ),
          },
        }
    });
  },
}));
const handleUpdateLabel = async (l: Partial<Label>) => {
  try {
    const { id } = l;

    loadingLabelId.value = String(id);
    await updateLabel({ data: l });
    alerts.success(`You updated a label`);
  } catch (error) {
    console.error("Error updating label:", error);
  } finally {
    loadingLabelId.value = null;
  }
};

const handleSelectLabel = async (l: Partial<Label>) => {
  const { id } = l;

  loadingLabelId.value = String(id);
  await updateBoard({ 
    data: { labels: { reconnect: { id } } }, 
    filter: { id: boardId?.value } 
  })
  loadingLabelId.value = null;
}
const handleDeselectLabel = async (l: Partial<Label>) => {
  const { id } = l;

  loadingLabelId.value = String(id);
  await updateBoard({ 
    data: { labels: { disconnect: { id } } }, 
    filter: { id: boardId?.value } 
  })
  loadingLabelId.value = null;
}

const boardsQueryVariables = computed(() => ({
  customFilter: idUser
    ? {
        team: {
          users: {
            some: {
              id: {
                equals: idUser
              }
            }
          }
        }
      } 
    : null
}));
const { 
  mutate: deleteBoard, 
  onError: onDeleteError, 
  loading: deleteLoading, 
} = useMutation(deleteBoardMutation, {
  update(cache, { data: { boardDelete } }, { variables }) {
    if (boardDelete.success) {
      cache.updateQuery(
        { query: boardsQuery, variables: boardsQueryVariables.value }, 
        (res) => {
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

const { mutate: deleteLabel, onError: onDeleteLabelError } = useMutation(
  deleteLabelMutation, 
  {
    update(cache, { data: { labelDeleteByFilter } }, { variables }) {
      if (labelDeleteByFilter.success) {
        cache.updateQuery({ query: labelsQuery }, (res) => {
          if (res?.labelsList)
            return {
              labelsList: {
                items: res.labelsList.items.filter(
                  (label: Partial<Label>) => 
                    label.id !== variables?.filter.id.equals
                ),
              },
            }
        });
      }
    },
  }
);
onDeleteLabelError((error) => {
  console.error(error);
  alerts.error("Error deleting label");
});
const handleDeleteLabel = async (l: Partial<Label>) => {
  try {
    const { id } = l;

    loadingLabelId.value = String(id);
    const result = await deleteLabel({ filter: { id: { equals: id } } });

    if (result?.data.labelDeleteByFilter?.success) 
      alerts.success(`Label with ID ${id} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting label:", error);
  } finally {
    loadingLabelId.value = null;
  }
};
</script>

<template>
  <AppLoader 
    v-if="loading || labelsLoading || loadingUpdateBoard" 
    :overlay="true" 
  />
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
    
    <BoardMenu 
      :board="board"
      :labels="labels"
      :selectedLabels="selectedLabels"
      :delete-loading="deleteLoading"
      :create-label-loading="createLabelLoading"
      :loading-label-id="loadingLabelId"
      @deleteBoard="handleDeleteBoard(route.params.id as string)"
      @createLabel="handleLabelCreate"
      @selectLabel="handleSelectLabel"
      @deselectLabel="handleDeselectLabel"
      @deleteLabel="handleDeleteLabel"
      @updateLabel="handleUpdateLabel"
    />

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
