<script lang="ts">
  import { auth } from "../config/firebase.config";
  import { GithubAuthProvider, signInWithPopup } from "firebase/auth";

  const GithubProvider = new GithubAuthProvider();
  GithubProvider.addScope("read:user");
  function signIn() {
    signInWithPopup(auth, GithubProvider)
      .then((result) => {
        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        console.log("credential", credential);
        console.log("result", result);
        console.log(`token ${token}, user ${JSON.stringify(user)}`);
        fetch("https://api.github.com/user", {
          method: "GET",
          headers: {
            Authorization: `token ${token}`,
          },
        })
          .then((res) => res.json())
          .then((res) => {
            console.log("gh user:", res);
          });
      })
      .catch((error) => {
        console.error(`Code ${error.code}, Message ${error.message}`);
        const credential = GithubAuthProvider.credentialFromError(error);
        console.error("credential err", credential);
      });
  }
</script>

<main>
  <button on:click={signIn}>Sign In With GitHub</button>
</main>

<style>
</style>
