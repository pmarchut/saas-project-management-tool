<script setup lang="ts">
import type { Task } from '@/types';
import { 
  Card, 
  CardTitle, 
  CardHeader, 
  Avatar, 
  CardSubtitle,
  CardActions 
} from '@progress/kendo-vue-layout';
import { Chip } from '@progress/kendo-vue-buttons';
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { useDateFormat } from '@vueuse/core';
const props = defineProps<{
  task: Task,
}>();
const date = useDateFormat(props.task.dueAt, "MM/DD");
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex justify-between">
        <CardTitle>
          {{ task.title }}
        </CardTitle>
        <Avatar type="image" size="medium" shape="circle">
          <img
            style="height: 45px; width: 45px;" 
            src="https://api.dicebear.com/9.x/adventurer/svg?seed=Ryker"
          />
        </Avatar>
      </div>

      <CardSubtitle>
        <Chip 
          v-if="task.dueAt"
          :text="date"
          value="chip"
          rounded="full"
          icon="k-i-clock"
          theme-color="info"
        />
      </CardSubtitle>
    </CardHeader>

    <CardActions class="flex justify-end">
      <KButton
        :theme-color="'primary'"
        icon="arrow-right"
        @click.stop="
          $router.push(`/boards/${$route.params.id}/task/${task.id}`)
        "
      >
        Task details
      </KButton>
    </CardActions>
  </Card>
</template>
