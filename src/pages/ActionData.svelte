<script lang="ts">
  import { onMount } from "svelte";
  import { functions } from "../config/firebase.config";
  import { httpsCallable } from "firebase/functions";
  import AgGrid from "@michmich112/svelte-ag-grid";
  import { UserAuthStore, userAuthStore } from "../store";
  import { navigate } from "svelte-routing";
  import { appStore } from "../store";
  import MetricCard from "../components/MetricCard.svelte";
  import { Line } from "@michmich112/svelte-chartjs";
  import getActionRunGraphData from "../domain/functions/GetActionRunGraphData";

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

  let data: ActionRun[] = [];
  let username: string = "";

  $: runs = data.length;
  $: actors = data.reduce((acc, cur) => acc.add(cur.actor), new Set()).size;
  $: repos = data.reduce((acc, cur) => acc.add(cur.repository), new Set()).size;
  $: graphData = getActionRunGraphData(data);

  $: dataLine = {
    labels: graphData?.labels ?? [],
    datasets: [
      {
        label: "Run data",
        fill: true,
        lineTension: 0,
        backgroundColor: "rgba(225, 204,230, .3)",
        borderColor: "rgb(205, 130, 158)",
        borderCapStyle: "butt",
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: "miter",
        pointBorderColor: "rgb(205, 130,1 58)",
        pointBackgroundColor: "rgb(255, 255, 255)",
        pointBorderWidth: 10,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgb(0, 0, 0)",
        pointHoverBorderColor: "rgba(220, 220, 220,1)",
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: graphData?.data ?? [],
      },
    ],
  };

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
  <Line data={dataLine} options={{ responsive: true }} type="line" />
  <!-- <AgGrid bind:data {columnDefs} /> -->
</div>

<style>
  :global(:root) {
    --grid-height: 100%;
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

  .metric-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
  }

  .label {
    width: auto;
    height: auto;
    flex-shrink: 0;
    font-family: "Roboto Mono", monospace;
    font-style: normal;
    font-weight: 600;
  }

  .value {
    width: auto;
    height: auto;
    flex-shrink: 0;
    font-family: "Roboto Mono", monospace;
    font-style: normal;
    font-weight: 600;
  }
</style>
