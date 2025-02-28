<script setup lang="ts">

import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Popup as KPopup } from "@progress/kendo-vue-popup";

import { ref } from "vue";

import { useAuthUserStore } from "@/stores/AuthUserStore";

const showTeams = ref(false);
const authUserStore = useAuthUserStore();

</script>

<template>
  <div
    class="p-4 border-bottom border-2 flex justify-between"
    style="margin-bottom: -1px; margin-top: -1px"
  >
    <img 
      src="https://vuejsforge.com/.netlify/images?url=%2Fimages%2Flogo-vuejs-forge.svg"
      width="150"
      class="max-w-none"
      alt="Vue.js Forge"
    />
    <div>
      <button
        ref="button"
        class="mr-5 text-[#ff6358]"
        @click="showTeams = !showTeams"
      >
        <span class="k-icon k-i-ungroup"></span>
        My Team
      </button>
      <KPopup :anchor="'button'" :show="showTeams" class="mt-5">
        <ul>
          <li 
            v-for="team in authUserStore.user?.team.items" 
            :key="team.id" 
            class="px-5 py-2" 
            @click="showTeams = false">
            {{ team.name }}
          </li>
        </ul>
      </KPopup>

      <KButton :rounded="'full'" :shape="'rectangle'" :icon="'logout'" :theme-color="'warning'" @click="$router.push('/logout')">Logout</KButton>
    </div>
  </div>
</template>