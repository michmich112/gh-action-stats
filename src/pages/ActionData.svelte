<script lang="ts">
  import { onMount } from "svelte";
  import { functions } from "../config/firebase.config";
  import { httpsCallable } from "firebase/functions";
  import AgGrid from "@michmich112/svelte-ag-grid";
  import { UserAuthStore, userAuthStore } from "../store";
  import { navigate } from "svelte-routing";

  export let actionCreator: string;
  export let actionName: string;

  type ActionRun = {
    actor: string;
    ip: string;
    os: string | null;
    timestamp: string;
    repository: string | null;
    is_private: boolean;
  };

  type Action = {
    creator: string;
    name: string;
    last_update: { _secoonds: number; _nanoseconds: number };
  };

  let data = [];
  let username: string = "";

  const columnDefs = [
    { headerName: "actor", field: "actor", sortable: true },
    { headerName: "timestamp", field: "timestamp", sortable: true },
    { headerName: "ip", field: "ip" },
    { headerName: "repository", field: "repository", sortable: true },
    { headerName: "os", field: "os", sortable: true },
  ];

  userAuthStore.subscribe((userAuth: UserAuthStore) => {
    username = userAuth.github.username;
  });

  onMount(async () => {
    // return a 404 if not the correct user for safety puposes
    if (actionCreator !== username) {
      navigate("/error/404");
      return;
    }

    const getAction = httpsCallable<{}, Action>(functions, "getAction");
    const getActionRuns = httpsCallable<{}, ActionRun[]>(
      functions,
      "getActionRuns"
    );
    // Validate that the action exists and the user has access to it
    try {
      (await getAction({ creator: actionCreator, action: actionName })).data;
    } catch (e) {
      console.error(e.message);
      navigate("/error/404");
      return;
    }
    // fetch the run data
    try {
      data = (
        await getActionRuns({ creator: actionCreator, action: actionName })
      ).data;
    } catch (e) {
      alert(
        `Error fetching run data ${e.message}. If the issue persists open a ticket on github.`
      );
      console.error(e);
    }
  });
</script>

<div class="grid-container">
  <AgGrid bind:data {columnDefs} />
</div>

<style>
  :global(:root) {
    --grid-height: 100%;
  }

  .grid-container {
    width: 100%;
    height: 100%;
  }
</style>
