<script setup lang="ts">
import { useBase64, useDropZone } from "@vueuse/core";
import { ref, computed } from "vue";
import use8baseStorage from "@/composables/use8baseStorage";
const props = defineProps<{
  image?: string
  loading?: boolean
}>();
const emit = defineEmits<{
  (e: "upload", payload: { id: string}): void;
}>();
const dropzoneEl = ref<HTMLElement | null>(null);
const file = ref<string | File | null | undefined>(props.image);
const { base64 } = useBase64(file);
const uploadingToFilestack = ref(false);
const src = computed(() => 
  typeof props.image === 'string' ? props.image : base64.value
)

// functions
function onFileSelect(e: Event) {
  handleFiles((e.target as HTMLInputElement).files);
}
function onDrop(files: File[] | null) {
  handleFiles(files);
}
const { uploadAsset } = use8baseStorage();
async function handleFiles(files: FileList | File[] | null) {
  if (!files) return;
  file.value = files[0];
  uploadingToFilestack.value = true;
  const res = await uploadAsset(files[0]);
  emit("upload", res?.data.fileCreate);
  uploadingToFilestack.value = false;
}
const { isOverDropZone } = useDropZone(dropzoneEl, onDrop)
</script>

<template>
  <div
    ref="dropzoneEl"
    class="bg-gray-100 p-2 flex justify-center items-center border-2 border-gray-100 relative"
    :class="{
      'border-blue-200': isOverDropZone
    }"
  >
    <label class="absolute top-0 left-0 right-0 bottom-0 block z-10">
      <input
        accept="image/png image/jpeg"
        class="hidden"
        type="file"
        @change="onFileSelect" 
      />
    </label>
    <AppImage v-if="file" :src="src" class="aspect-video w-56" />
    <template v-else>{{ "Click or drop to upload image" }}</template>
    <AppLoader v-if="loading || uploadingToFilestack" :overlay="true" />
  </div>
</template>
