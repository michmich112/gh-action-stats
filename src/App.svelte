<script lang="ts">
  import { UserAuthStore, userAuthStore } from "./store";
  import Loader from "./components/Loader.svelte";
  import Header from "./components/Header.svelte";
  import Landing from "./pages/Landing.svelte";
  import Authentication from "./pages/Authentication.svelte";
  import Dashboard from "./pages/Dashboard.svelte";
  import ActionData from "./pages/ActionData.svelte";
  import Error from "./pages/Error.svelte";
  import GetStarted from "./pages/GetStarted.svelte";

  import Modal from "svelte-simple-modal";
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
<Modal>
  <Header />
  <main>
    <Router {url}>
      <Route path="/get-started" component={GetStarted} />
      <Route path="/error/:id" let:params><Error code={params.id} /></Route>
      <Route path="/auth" component={Authentication} />
      <Route path="/error/:id" let:params><Error code={params.id} /></Route>
      {#if authenticated}
        <Route path="/action/:userId/:actionName" let:params>
          <ActionData
            actionCreator={params.userId}
            actionName={params.actionName}
          />
        </Route>
        <Route path="/dash/{username}" component={Dashboard} />
        <Route path="/" component={Landing} />
        <Route path="*"><Error code="404" /></Route>
      {/if}
      {#if !authenticated}
        <Route path="/" component={Landing} />
        <Route path="*" component={Authentication} />
      {/if}
    </Router>
  </main>
</Modal>

<style>
  main {
    width: 100%;
    top: 50px;
    position: absolute;
  }

  @media only screen and (max-width: 500px) {
    main {
      top: 140px;
    }
  }
</style>
