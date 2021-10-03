<script lang="ts">
  import GitHubAuth from "../components/GitHubAuth.svelte";
  import Loader from "../components/Loader.svelte";
  import { appStore } from "../store";

  let loading: boolean;
  appStore.subscribe((s) => {
    loading = s.isLoading;
  });
</script>

{#if loading}
  <Loader />
{:else}
  <main>
    <GitHubAuth />
  </main>
{/if}

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
</style>
