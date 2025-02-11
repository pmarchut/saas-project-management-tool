import { defineStore } from "pinia";
import { authClient } from "@/helpers/8baseAuth";
import currentUserQuery from "@/graphql/queries/currentUser.query.gql";
import userSignUpMutation from "@/graphql/mutations/userSignUp.mutation.gql";
import { apolloClient } from "@/graphql/apolloClient"; 
import type { User } from "@/types";

const localStorageKey = "id_token";
const localStorageKeyUserId = "id_user";
const idToken = localStorage.getItem(localStorageKey);
const idUser = localStorage.getItem(localStorageKeyUserId);

export const useAuthUserStore = defineStore("AuthUserStore", {
  state: () => {
    return {
      authenticated: !!idToken,
      idToken,
      user: null as User | null,
    };
  },
  actions: {
    login() {
      authClient.authorize();
    },

    async initUser() {
      if (!this.idToken || !idUser) return;
      try {
        const res = await this.fetchUser(this.idToken);
        this.user = res.data.user;
      } catch (error) {
        console.log("no existing user matching id token");
      }
    },
    fetchUser(idToken: string) {
      const context = {
        headers: {
          authorization: `Bearer ${idToken}`,
        }
      };
      return apolloClient.query({
        query: currentUserQuery,
        context,
      })
    },
    logout() {
      authClient.logout();
      this.authenticated = false;
      this.idToken = null;
      localStorage.removeItem(localStorageKey);
      localStorage.removeItem(localStorageKeyUserId);
    },
    async handleAuthentication() {
      const authResult = authClient.getAuthorizedData();
      let user: User | null = null;

      /**
       * Check if user exists in 8base
       */
      try {
        const res = await this.fetchUser(authResult.idToken);

        user = res.data.user;
      } catch {
        /**
         * If user doesn't exist, on error will be
         * thrown, which then the new user can be
         * created using the authResult values.
         */
        const res = await apolloClient.mutate({
          mutation: userSignUpMutation,
          variables: {
            user: {
              email: authResult.email,
              firstName: authResult.firstName,
              lastName: authResult.lastName,
              team: {
                create: {
                  name: `${authResult.firstName}'s team`,
                },
              },
            },
            authProfileId: import.meta.env.VITE_AUTH_PROFILE_ID,
          },
          context: {
            headers: {
              authorization: `Bearer ${authResult.idToken}`,
            },
          },
        });

        user = res.data.user;
      }

      this.authenticated = true;
      this.idToken = authResult.idToken;
      localStorage.setItem(localStorageKey, authResult.idToken);

      if (user?.id) localStorage.setItem(localStorageKeyUserId, user.id);
    }
  }
});
