<script lang="ts">
  import { onMount } from "svelte";
  import { functions } from "../config/firebase.config";
  import { httpsCallable } from "firebase/functions";
  import AgGrid from "@michmich112/svelte-ag-grid";
  import { UserAuthStore, userAuthStore } from "../store";
  import { navigate } from "svelte-routing";
  import { appStore } from "../store";
  import MetricCard from "../components/MetricCard.svelte";
  import RunGraph from "../components/RunGraph.svelte";
  import ReposGraph from "../components/ReposGraph.svelte";
  import type ActionRun from "../domain/types/ActionRun";

  export let actionCreator: string;
  export let actionName: string;

  type Action = {
    creator: string;
    name: string;
    last_update: { _secoonds: number; _nanoseconds: number };
  };

  let data: ActionRun[] = [];
  let username: string = "";

  $: sortedData = data.sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
  );

  $: runs = data.length;
  $: actors = data.reduce((acc, cur) => acc.add(cur.actor), new Set()).size;
  $: repos = data.reduce((acc, cur) => acc.add(cur.repository), new Set()).size;

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
    appStore.update((s) => ({ ...s, isLoading: true }));
    // return a 404 if not the correct user for safety puposes
    if (actionCreator !== username) {
      navigate("/error/404");
      appStore.update((s) => ({ ...s, isLoading: false }));
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
      appStore.update((s) => ({ ...s, isLoading: false }));

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
    appStore.update((s) => ({ ...s, isLoading: false }));
  });
</script>

<div class="metric-cards">
  <MetricCard label="Runs" value={runs.toString()} />
  <MetricCard label="Actors" value={actors.toString()} />
  <MetricCard label="Repositories" value={repos.toString()} />
</div>

<div class="grid-container">
  <div class="data-item">
    <div class="graph">
      <RunGraph data={sortedData} />
    </div>
    <div class="graph">
      <ReposGraph data={sortedData} />
    </div>
  </div>
  <div class="data-item data-table">
    <AgGrid {data} {columnDefs} />
  </div>
</div>

<style>
  :global(:root) {
    --grid-height: 100%;
  }

  .graph {
    width: 45vw;
    min-width: 300px;
  }

  .grid-container {
    width: 100%;
    height: 100%;
  }

  .metric-cards {
    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    margin: 10px 1px;
  }

  .grid-container {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    align-content: center;
    margin: 10px 10px;
  }

  .data-item {
    width: 95%;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-content: space-around;
    align-items: flex-start;
    flex-wrap: wrap;
    margin: 10px;
  }

  .data-table {
    height: 45vh;
    min-height: 300px;
  }
</style>
