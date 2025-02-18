<template>
  <div class="task-dialog">
    <AppLoader v-if="loading" :overlay="true" />
    <KDialog 
      v-if="task" 
      :title="taskResult?.task?.title" 
      @close="onCloseClicked" 
      class="overflow-auto"
      id="task-dialog"
    >
      <div class="sm:flex">
        <main>
          <div class="form-group">
            <label for="description" class="font-bold text-xl">
              <span class="k-icon k-i-align-left"></span>
              Description
            </label>
            <KTextArea id="description" v-model="task.description" />
          </div>

          <div class="form-group mt-10">
            <label for="comments" class="font-bold text-xl">
              <span class="k-icon k-i-comment"></span>
              Comments
            </label>
            <KEditor 
              @change="newComment = $event.html"
              :key="editorIncrementToRenderer"
              id="comments"
              :tools="[
                ['Bold', 'Italic', 'Underline', 'Strikethrough'],
                ['AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify'],
                ['OrderedList', 'UnorderedList'],
                ['Indent', 'Outdent'],
                'FontSize',
                'FormatBlock',
                ['Undo', 'Redo'],
                ['Link', 'Unlink', 'InsertImage', 'ViewHtml'],
              ]"
              :content-style="{
                height: '200px',
              }"
            />
            <KButton :theme-color="'primary'" @click="handleNewComment"
              >Add Comment</KButton>
          </div>

          <div
            v-for="comment in comments"
            :key="comment.message"
            v-html="comment.message"
          ></div>

          <strong>Task</strong>
          <pre>{{ task }}</pre>
          <strong>Comments</strong>
          <pre class="whitespace-pre-wrap">{{ comments }}</pre>
          <strong>Labels</strong>
          <pre>{{ labels }}</pre>
        </main>
        <aside
          class="pl-5 sm:w-[300px] border-t-gray-300 border-t-2 pt-5 mt-5 sm:border-t-0"
        >
          <ul class="m-auto">
            <li class="my-3">
              <strong class="text-xs mb-2 block">Task Labels</strong>
              <AppLabelsPicker 
                :labels="props.labels" 
                :selected="labels" 
                @selectionUpdate="labels = $event"
                @create="emit('createLabel', $event)"
                @delete="emit('deleteLabel', $event)"
                @labelUpdate="emit('updateLabel', $event)"
              />
            </li>
            <li class="my-3">
              <strong class="text-xs mb-2 block" for="calendar"
                >Task Due Date</strong>

              <KCalendar v-model="task.dueAt" />
            </li>
          </ul>
        </aside>
      </div>

      <KDialogActionsBar>
        <KButton @click="onCloseClicked">Cancel</KButton>
        <KButton 
          @click="onSaveClicked" 
          :disabled="props.loadingUpdateTask" 
          theme-color="primary"
        >
          Save Task
        </KButton>
      </KDialogActionsBar>
    </KDialog>
  </div>
</template>

<script lang="ts" setup>
import { 
  Dialog as KDialog, 
  DialogActionsBar as KDialogActionsBar,
} from "@progress/kendo-vue-dialogs";
import { TextArea as KTextArea } from "@progress/kendo-vue-inputs";
import { Calendar as KCalendar } from "@progress/kendo-vue-dateinputs"
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Editor as KEditor } from "@progress/kendo-vue-editor";
import getTaskQuery from "@/graphql/queries/task.query.gql";
import { useRoute } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { ref, onBeforeUnmount, onMounted } from "vue";
import type { Comment, Label, Task } from "@/types";
import moment from "moment";
import { useAlerts } from "@/stores/alerts";
import { getCurrentBreakpoint } from "@/composables/useBreakpoint";
import { on } from "events";

const props = defineProps<{
  loadingUpdateTask: boolean;
  labels: Partial<Label>[];
}>();
const alerts = useAlerts();
// emits
const emit = defineEmits<{
  (e: "updateTask", payload: Partial<Task>): void;
  (e: "close", payload: null): void;
  (e: "createLabel", payload: Partial<Label>): void;
  (e: "deleteLabel", payload: Partial<Label>): void;
  (e: "updateLabel", payload: Partial<Label>): void;
}>();

const route = useRoute();

const { loading, result: taskResult, onResult: onTaskLoaded, onError: onTaskError } = useQuery(
  getTaskQuery,
  {
    id: route.params.taskId,
  },
  {
    fetchPolicy: "cache-and-network",
  },
);
onTaskError(() => alerts.error("Error loading task"));

const task = ref<null | Partial<Task>>(null);
const labels = ref<Partial<Label>[]>([]);
const comments = ref<Partial<Comment>[]>([]);
// convert to mutable data to use with form
onTaskLoaded((result) => {
  const data = result.data?.task;
  if (!data) {
    task.value = null;
    return;
  }

  task.value = { 
    ...JSON.parse(JSON.stringify(data)), 
    dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
  };
  labels.value = JSON.parse(JSON.stringify(data.labels?.items || []));
  delete task.value?.labels;
  comments.value = JSON.parse(JSON.stringify(data.comments?.items || []));
  delete task.value?.comments;
})

const newComment = ref<string>("");
const editorIncrementToRenderer = ref(0);

function handleNewComment() {
  if (!newComment.value) return;
  comments.value.push({ message: newComment.value });
  newComment.value = "";
  editorIncrementToRenderer.value++;
}

function onCloseClicked() {
  emit("close", null);
}

function onSaveClicked() {
  const newComments = comments.value.filter(
    (c, index) => 
      comments.value.length - editorIncrementToRenderer.value <= index
  );

  emit("updateTask", { 
    ...task.value, 
    dueAt: task.value?.dueAt 
      ? moment(task.value.dueAt).format("YYYY-MM-DD") 
      : null,
    comments: newComments.length ? newComments : undefined,
    labels: labels.value.length ? labels.value : undefined,
  })
  onCloseClicked()
}

function updateDialogPosition() {
  setTimeout(() => {
    const viewport = window.visualViewport;
    const dialog = document.querySelector(
      '[aria-labelledby="task-dialog"]'
    ) as HTMLElement;
    const app = document.getElementById("app") as HTMLElement;

    if (dialog && app && viewport && getCurrentBreakpoint() === "sm") {
      app.style.overflow = "hidden";
      dialog.style.position = "absolute";
      dialog.style.left = `${viewport.offsetLeft}px`;
      dialog.style.top = "0";
      dialog.style.width = `${viewport.width}px`;
      dialog.style.height = `${viewport.height}px`;
    } else {
      app.style.overflow = "";
      dialog.style.position = "";
      dialog.style.left = "";
      dialog.style.top = "";
      dialog.style.width = "";
      dialog.style.height = "";
    }
  }, 400);
}

onMounted(() => {
  updateDialogPosition();
  window.addEventListener("resize", updateDialogPosition);
});

onBeforeUnmount(() => {
  const app = document.getElementById("app") as HTMLElement;

  app.style.overflow = "";
  window.removeEventListener("resize", updateDialogPosition);
});
</script>

<style>
.task-dialog .k-dialog-wrapper .k-dialog {
  @apply md:max-h-[96dvh] md:max-w-[96dvw];
}
</style>
