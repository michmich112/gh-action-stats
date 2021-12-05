<script lang="ts">
  import GithubButton from "./GithubButton.svelte";
  import { auth, functions } from "../config/firebase.config";
  import {
    browserLocalPersistence,
    GithubAuthProvider,
    setPersistence,
    signInWithPopup,
  } from "firebase/auth";
  import { httpsCallable } from "firebase/functions";
  import { appStore, userAuthStore } from "../store";
  import { navigate } from "svelte-routing";

  const GithubProvider = new GithubAuthProvider();
  GithubProvider.addScope("read:user"); //c.f. docs: https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps

  async function signIn() {
    appStore.update((s) => ({ ...s, isLoading: true }));
    await setPersistence(auth, browserLocalPersistence);
    try {
      const result = await signInWithPopup(auth, GithubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;

      const loginUser = httpsCallable(functions, "loginUser");
      const res = await loginUser({ GithubToken: token });
      const { data } = res as any;
      if (data.code > 201 || !data.username) {
        alert("Unable to authenticate. Try again.");
      } else {
        userAuthStore.set({
          authenticated: true,
          userId: user.uid,
          expiry: new Date().getTime() + 360000, // 1h expiry
          github: {
            avatarUrl: data.avatar_url,
            username: data.username,
            email: data.email,
            token: credential.accessToken,
          },
        });
        navigate(`/dash/${data.username}`);
      }
      appStore.update((s) => ({ ...s, isLoading: false }));
    } catch (error) {
      console.error(`Code ${error.code}, Message ${error.message}`);
      const credential = GithubAuthProvider.credentialFromError(error);
      console.error("credential err", credential);
      appStore.update((s) => ({ ...s, isLoading: false }));
    }
  }
</script>

<GithubButton onClick={signIn} />
