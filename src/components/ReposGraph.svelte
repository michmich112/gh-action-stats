<script lang="ts">
  import { Line } from "@michmich112/svelte-chartjs";
  import {
    getActionReposGraphData,
    getActionActorsGraphData,
  } from "../domain/functions/GetActionRunGraphData";
  import type ActionRun from "../domain/types/ActionRun";

  export let data: ActionRun[] = [];

  $: individualReposData = getActionReposGraphData(data);
  $: individualActorsData = getActionActorsGraphData(data);
  $: dataLine = {
    labels: individualReposData?.labels ?? [],
    datasets: [
      {
        label: "Individual Repos",
        fill: true,
        lineTension: 0,
        backgroundColor: "rgba(35, 125, 220, .3)",
        borderColor: "rgb(35, 26, 136)",
        borderCapStyle: "butt",
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: "miter",
        pointBorderColor: "rgb(35, 26, 136)",
        pointBackgroundColor: "rgb(255, 255, 255)",
        pointBorderWidth: 2,
        pointHoverRadius: 1,
        pointHoverBackgroundColor: "rgb(0, 0, 0)",
        pointHoverBorderColor: "rgba(220, 220, 220,1)",
        pointHoverBorderWidth: 1,
        pointRadius: 1,
        pointHitRadius: 10,
        data: individualReposData?.data ?? [],
      },
      {
        label: "Individual Actors",
        fill: true,
        lineTension: 0,
        backgroundColor: "rgba(215, 83, 63, .3)",
        borderColor: "rgb(255, 99, 71)",
        borderCapStyle: "butt",
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: "miter",
        pointBorderColor: "rgb(255, 99, 71)",
        pointBackgroundColor: "rgb(255, 255, 255)",
        pointBorderWidth: 2,
        pointHoverRadius: 1,
        pointHoverBackgroundColor: "rgb(0, 0, 0)",
        pointHoverBorderColor: "rgba(220, 220, 220,1)",
        pointHoverBorderWidth: 1,
        pointRadius: 1,
        pointHitRadius: 10,
        data: individualActorsData?.data ?? [],
      },
    ],
  };
</script>

<div class="chart-container">
  <Line data={dataLine} options={{ responsive: true }} />
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>
