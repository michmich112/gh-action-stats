<script lang="ts">
  import GitHubAuth from "../components/GitHubAuth.svelte";
  import { navigate } from "svelte-routing";
  import { UserAuthStore, userAuthStore } from "../store";

  let authenticated: boolean = false;
  let username: string = "";

  userAuthStore.subscribe((userAuth: UserAuthStore) => {
    authenticated = userAuth.authenticated;
    if (authenticated) username = userAuth.github.username;
  });

  if (authenticated) window.location.replace(`/dash/${username}`);
</script>

<div class="main">
  <div class="vertical-grid">
    <GitHubAuth />
    <h1>Or</h1>
    <button on:click={() => navigate("/get-started")}> Get Started </button>
  </div>
</div>

<style>
  .vertical-grid {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .main {
    text-align: center;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1em;
    padding: 0px 10px;
  }
</style>
