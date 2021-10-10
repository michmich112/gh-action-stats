<script lang="ts">
  import { auth, functions } from "../config/firebase.config";
  import { GithubAuthProvider, signInWithPopup } from "firebase/auth";
  import { httpsCallable } from "firebase/functions";
  import { appStore, userAuthStore } from "../store";
  import { navigate } from "svelte-routing";

  const GithubProvider = new GithubAuthProvider();
  GithubProvider.addScope("read:user");
  function signIn() {
    appStore.update((s) => ({ ...s, isLoading: true }));
    signInWithPopup(auth, GithubProvider)
      .then((result) => {
        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;

        const loginUser = httpsCallable(functions, "loginUser");
        loginUser({ GithubToken: token }).then((res) => {
          const { data } = res as any;
          if (data.code > 201 || !data.username) {
            alert("Unable to authenticate. Try again.");
          } else {
            userAuthStore.set({
              authenticated: true,
              userId: user.uid,
              github: {
                username: data.username,
                email: data.email,
                token: credential.accessToken,
              },
            });
            navigate(`/dash/${data.username}`);
          }
          appStore.update((s) => ({ ...s, isLoading: false }));
        });
      })
      .catch((error) => {
        console.error(`Code ${error.code}, Message ${error.message}`);
        const credential = GithubAuthProvider.credentialFromError(error);
        console.error("credential err", credential);
      });
  }
</script>

<button on:click={signIn}>Sign In With GitHub</button>
