<script lang="ts">
  import { UserAuthStore, userAuthStore } from "./store";
  import Header from "./components/Header.svelte";
  import Authentication from "./pages/Authentication.svelte";
  import Dashboard from "./pages/Dashboard.svelte";

  let authenticated: boolean = false;

  userAuthStore.subscribe((userAuth: UserAuthStore) => {
    authenticated = userAuth.authenticated;
  });
</script>

<Header />
<main>
  {#if !authenticated}
    <Authentication />
  {:else}
    <Dashboard />
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
