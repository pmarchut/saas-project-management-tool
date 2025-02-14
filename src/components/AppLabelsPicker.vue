<script setup lang="ts">
import { ref, watch } from "vue";
import { Input as KInput } from "@progress/kendo-vue-inputs";
import { Button as KButton } from "@progress/kendo-vue-buttons";
import type { Label } from "@/types";

type L = Partial<Label>;

// props
const props = defineProps<{
  labels: L[];
  selected: L[];
  createLabelLoading?: boolean;
  loadingLabelId?: string | null;
}>();

// emits
const emit = defineEmits<{
  (e: "select", payload: L): void;
  (e: "deselect", payload: L): void;
  (e: "create", payload: L): void;
  (e: "delete", payload: L): void;
  (e: "labelUpdate", payload: L): void;
  (e: "selectionUpdate", payload: L[]): void;
}>();

// local data
const labels = ref<L[]>(props.labels);
const selected = ref<L[]>(props.selected);
const showCreate = ref(false);
const newLabel = ref<L>({ 
  label: "",
  color: "red", 
});

// functions
function clone(object: Record<string, any>) {
  return JSON.parse(JSON.stringify(object));
}

function handleCreate() {
  emit("create", clone(newLabel.value));
  showCreate.value = false;
  resetNewLabel();
}

function handleUpdate(labelText: string, label: L) {
  emit("labelUpdate", { ...label, label: labelText });
}

function handleDelete(label: L) {
  emit("delete", clone(label));
}

function handleToggle(label: L) {
  if (selected.value?.map((l) => l.id).includes(label.id)) {
    selected.value = selected.value.filter((l) => l.id !== label.id);
    emit("deselect", clone(label));
  } else {
    selected.value = [...selected.value, label];
    emit("select", clone(label));
  }
  emit("selectionUpdate", clone(selected.value));
}

function resetNewLabel() {
  newLabel.value = { label: "", color: "red" };
}

watch(
  () => props.labels,
  () => {
    labels.value = props.labels;
  }
);
watch(
  () => props.selected,
  () => {
    selected.value = props.selected;
  }
);
</script>
<template>
  <div>
    <button 
      v-for="label in labels" 
      :key="label.id"
      :class="`bg-${label.color}-500 p-2 rounded text-white my-1 flex justify-between`"
    >
      <div class="flex items-center">
        <AppLoader v-if="loadingLabelId === label.id" />
        <span
          v-else
          @click.prevent="handleToggle(label)"
          class="w-4 h-4 mr-2"
          :class="{ 
            'k-icon k-i-check': selected.map((l) => l.id).includes(label.id)
          }"
        >
        </span>
        <input
          class="w-3/4 bg-transparent outline-none" 
          type="text"
          :value="label.label"
          @change="
            handleUpdate(($event.target as HTMLInputElement).value, label),
              ($event.target as HTMLInputElement).blur()
          "
        />
      </div>
      <button
        class="k-icon k-i-trash"
        :disabled="loadingLabelId === label.id"
        @click.prevent="handleDelete(label)"
      ></button>
    </button>
    <div>
      <button class="p-2" @click="showCreate = !showCreate">
        <span class="flex">
          <AppLoader v-if="props.createLabelLoading" />+ Create Label
        </span>
      </button>
      <div v-if="showCreate">
        <label class="block" :style="{ width: '230px' }">
          Label
          <KInput :style="{ width: '230px' }" v-model="newLabel.label"></KInput>
        </label>
        <label class="block">
          Color
          <AppColorInput v-model="newLabel.color" />
        </label>
        <KButton 
          @click="handleCreate" 
          class="block mt-3" 
          theme-color="primary" 
          :disabled="props.createLabelLoading"
        >
          Create
        </KButton>
      </div>
    </div>
  </div>
</template>