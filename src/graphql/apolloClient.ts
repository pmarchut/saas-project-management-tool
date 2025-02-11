import { ApolloClient, createHttpLink, InMemoryCache, from } from "@apollo/client/core";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename";
import { useAuthUserStore } from "@/stores/AuthUserStore";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

const httpLink = createHttpLink({
  uri: "https://uk.api.8base.com/cm3ynckg1000009jx85oo359h",
});
const removeTypenameLink = removeTypenameFromVariables();
const link = from([removeTypenameLink, httpLink]);

// Authorization Link
const setAuthorizationLink = setContext((request, previousContext) => {
  const store = useAuthUserStore();
  return store.authenticated
    ? {
        ...previousContext,
        headers: {
          authorization: `Bearer ${store.idToken}`,
        },
      }
    : previousContext;
});
  
// Error handling
const setErrorHandler = onError((error) => {
const badToken = !!error.response?.errors?.find(
    (e: { code: string }) =>
      e.code === "TokenExpiredError" || e.code === "InvalidTokenError"
  );
  if (badToken) {
    const store = useAuthUserStore();
    store.logout();
  }
});
  
const cache = new InMemoryCache();
  
export const apolloClient = new ApolloClient({
  link: setAuthorizationLink.concat(setErrorHandler).concat(link),
  cache,
});
