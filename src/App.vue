<script setup lang="ts">
import { useAuthUserStore } from "./stores/AuthUserStore";
import { useRouter, useRoute } from "vue-router";
import { watch } from "vue";
const router = useRouter();
const route = useRoute();
const authPages = ["login", "logout"];
const commonPages = ["auth-callback"];
const authUserStore = useAuthUserStore();

authUserStore.initUser();

watch(
  route, 
  () => {
    if (commonPages.includes(String(route.name))) return;

    if (!localStorage.getItem("id_token") || !localStorage.getItem("id_user")) {
      if (!authPages.includes(String(route.name))) router.push("/login");
    } else {
      if (authPages.includes(String(route.name)) || route.name === "index") 
        router.push("/boards");
    }
  },
  { once: true }
);
</script>

<template>
  <TheNavbar />
  <TheDrawer />
  <TheAlerts />
</template>
