import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";

// plugins
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import graphql from "@rollup/plugin-graphql";
import Pages from "vite-plugin-pages";
import WindiCSS from "vite-plugin-windicss";
import Components from "unplugin-vue-components/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), graphql(), Pages(), Components(), WindiCSS()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
