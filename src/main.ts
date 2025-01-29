import { createApp, provide, h } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "@/assets/base.css";
import "@progress/kendo-theme-default/dist/all.css";
import { ApolloClient, createHttpLink, gql, InMemoryCache, from } from '@apollo/client/core'
import { removeTypenameFromVariables } from '@apollo/client/link/remove-typename';
import { DefaultApolloClient } from '@vue/apollo-composable'

const httpLink = createHttpLink({
  uri: 'https://uk.api.8base.com/cm3ynckg1000009jx85oo359h',
})
const removeTypenameLink = removeTypenameFromVariables();
const link = from([removeTypenameLink, httpLink]);

const cache = new InMemoryCache()

const apolloClient = new ApolloClient({
  link,
  cache,
})

const app = createApp({
  setup () {
    provide(DefaultApolloClient, apolloClient)
  },

  render: () => h(App),
})

app.use(router).use(createPinia());

app.mount("#app");
