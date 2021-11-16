<script lang="ts">
  import { Line } from "@michmich112/svelte-chartjs";
  import getActionRunGraphData from "../domain/functions/GetActionRunGraphData";
  import type ActionRun from "../domain/types/ActionRun";

  export let data: ActionRun[] = [];

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
        pointBorderWidth: 2,
        pointHoverRadius: 1,
        pointHoverBackgroundColor: "rgb(0, 0, 0)",
        pointHoverBorderColor: "rgba(220, 220, 220,1)",
        pointHoverBorderWidth: 1,
        pointRadius: 1,
        pointHitRadius: 10,
        data: graphData?.data ?? [],
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
