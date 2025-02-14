<script setup lang="ts">
import { ref } from "vue";
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Popup as KPopup } from "@progress/kendo-vue-popup";
import { onClickOutside } from "@vueuse/core";
import { useMutation } from "@vue/apollo-composable";
import attachImageToBoardMutation from "@/graphql/mutations/attachImageToBoard.mutation.gql";
import { useAlerts } from "@/stores/alerts";
import type { Board, Label } from "@/types";

const alerts = useAlerts();

const props = defineProps<{
  board: Partial<Board>;
  labels: Partial<Label>[];
  selectedLabels: Partial<Label>[];
  deleteLoading?: boolean;
  createLabelLoading?: boolean;
  loadingLabelId?: string | null;
}>();

const showMenu = ref(false);
const menu = ref(null);

onClickOutside(menu, () => setTimeout(() => (showMenu.value = false), 2));

const emit = defineEmits<{
  (e: "deleteBoard", payload: null): void;
  (e: "imageUpload", payload: { id: string }): void;
  (e: "createLabel", payload: Partial<Label>): void;
  (e: "selectLabel", payload: Partial<Label>): void;
  (e: "deselectLabel", payload: Partial<Label>): void;
  (e: "deleteLabel", payload: Partial<Label>): void;
  (e: "updateLabel", payload: Partial<Label>): void;
}>()

const {
  mutate: attachImageToBoard,
  onError: errorAttachingImage,
  onDone: onImageAttached,
  loading: imageLoading,
} = useMutation(attachImageToBoardMutation);
errorAttachingImage((error) => {
  console.log(error);
  alerts.error("Error setting board image");
});
onImageAttached((result) => {
  emit("imageUpload", result.data.boardUpdate.image)
})
</script>

<template>
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
    :popupClass="'p-4'" 
    :anchorAlign="{ horizontal: 'right', vertical: 'bottom' }" 
    :popupAlign="{ horizontal: 'right', vertical: 'top' }">
    <div ref="menu">
      <ul>
        <li>
          <KButton
            :theme-color="'error'"
            :fill-mode="'flat'"
            :icon="'trash'"
            :disabled="props.deleteLoading"
            @click="emit('deleteBoard', null)"
          >
            <template v-if="props.deleteLoading">
              <AppLoader /> Deleting...
            </template>
            <template v-else>Delete Board</template>
          </KButton>
        </li>
        <li>
          <strong>Board Image</strong>
          <AppImageDropzone 
            class="aspect-video w-56"
            :image="board.image?.downloadUrl"
            :loading="imageLoading"
            @upload="
              attachImageToBoard({
                id: board.id,
                imageId: $event.id,
              })
            "
          />
        </li>
        <li>
          <AppLabelsPicker 
            :labels="props.labels" 
            :selected="props.selectedLabels"
            :create-label-loading="createLabelLoading"
            :loading-label-id="loadingLabelId"
            @create="emit('createLabel', $event)"
            @select="emit('selectLabel', $event)"
            @deselect="emit('deselectLabel', $event)"
            @delete="emit('deleteLabel', $event)"
            @labelUpdate="emit('updateLabel', $event)"
          />
        </li>
      </ul>
    </div>
  </KPopup>
</template>
