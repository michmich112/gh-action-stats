<script lang="ts">
  import { onMount, getContext } from "svelte";
  import { functions } from "../config/firebase.config";
  import { httpsCallable } from "firebase/functions";
  import AgGrid from "@michmich112/svelte-ag-grid";
  import { appStore, UserAuthStore, userAuthStore } from "../store";
  import { navigate } from "svelte-routing";
  import MetricCard from "../components/MetricCard.svelte";
  import RunGraph from "../components/RunGraph.svelte";
  import ReposGraph from "../components/ReposGraph.svelte";
  import OptionsModal from "../components/OptionsModal.svelte";
  import type ActionRun from "../domain/types/ActionRun";

  export let actionCreator: string;
  export let actionName: string;

  const { open } = getContext("simple-modal");

  type Action = {
    creator: string;
    name: string;
    last_update: { _secoonds: number; _nanoseconds: number };
  };

  let data: ActionRun[] = [];
  let username: string = "";
  let token: string = "";

  $: sortedData = data.sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
  );

  $: runs = data.length;
  $: actors = data.reduce((acc, cur) => acc.add(cur.actor), new Set()).size;
  $: repos = data.reduce((acc, cur) => acc.add(cur.repository), new Set()).size;

  const options = {
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: "agTextColumnFilter",
    },
  };

  const columnDefs = [
    {
      headerName: "Actor",
      field: "actor",
    },
    {
      headerName: "Timestamp",
      field: "timestamp",
      sortable: true,
      filter: "agDateColumnFilter",
      filterParams: {
        comparator: (filterDate: Date, cellValue: string) => {
          const d = new Date(Date.parse(cellValue));
          if (d < filterDate) {
            return -1;
          } else if (d > filterDate) {
            return 1;
          }
          return 0;
        },
      },
    },
    { headerName: "IP", field: "ip" },
    {
      headerName: "Repo",
      field: "repository",
    },
    {
      headerName: "OS",
      field: "os",
    },
    {
      headerName: "Repo Private",
      field: "is_private",
    },
  ];

  userAuthStore.subscribe((userAuth: UserAuthStore) => {
    username = userAuth.github.username;
    token = userAuth.github.token;
  });

  function openOptionsModal() {
    open(OptionsModal, { owner: actionCreator, repo: actionName });
  }

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
        await getActionRuns({
          creator: actionCreator,
          action: actionName,
          token,
        })
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

<div class="options-bar">
  <div on:click={openOptionsModal} class="clickable">
    <img
      src="/assets/feather/settings.svg"
      alt="settings"
      width="24px"
      height="24px"
    />
  </div>
</div>

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
    <AgGrid {data} {columnDefs} {options} />
  </div>
</div>

<style>
  :global(:root) {
    --grid-height: 100%;
  }

  .clickable {
    cursor: pointer;
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

  .options-bar {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
  }
</style>
