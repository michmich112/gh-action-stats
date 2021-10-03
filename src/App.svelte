<script lang="ts">
  import { UserAuthStore, userAuthStore } from "./store";
  import Loader from "./components/Loader.svelte";
  import Header from "./components/Header.svelte";
  import Authentication from "./pages/Authentication.svelte";
  import Dashboard from "./pages/Dashboard.svelte";

  let authenticated: boolean = false;

  userAuthStore.subscribe((userAuth: UserAuthStore) => {
    authenticated = userAuth.authenticated;
  });
</script>

<Loader />
<Header />
{#if !authenticated}
  <Authentication />
{:else}
  <Dashboard />
{/if}
