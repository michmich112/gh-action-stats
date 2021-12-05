<script lang="ts">
  import { UserAuthStore, userAuthStore } from "./store";
  import Loader from "./components/Loader.svelte";
  import Header from "./components/Header.svelte";
  import Authentication from "./pages/Authentication.svelte";
  import Dashboard from "./pages/Dashboard.svelte";
  import ActionData from "./pages/ActionData.svelte";
  import Error from "./pages/Error.svelte";
  import GetStarted from "./pages/GetStarted.svelte";

  import { Router, Route, navigate } from "svelte-routing";

  let authenticated: boolean = false;
  let username: string = "";
  $: url = window.location.pathname;

  userAuthStore.subscribe((userAuth: UserAuthStore) => {
    authenticated = userAuth.authenticated;
    if (authenticated) username = userAuth.github.username;
  });
</script>

<Loader />
<Header />
<main>
  <Router {url}>
    <Route path="/get-started" component={GetStarted} />
    {#if !authenticated}
      <Route path="/error/:id" let:params><Error code={params.id} /></Route>
      <Route component={Authentication} />
    {:else}
      <Route path="/error/:id" let:params><Error code={params.id} /></Route>
      <Route path="/action/:userId/:actionName" let:params>
        <ActionData
          actionCreator={params.userId}
          actionName={params.actionName}
        /></Route
      >
      <Route path="/dash/{username}" component={Dashboard} />
      <Route component={Dashboard} />
    {/if}
  </Router>
</main>

<style>
  main {
    width: 100%;
    top: 50px;
    position: absolute;
  }
</style>
