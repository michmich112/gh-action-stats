<script lang="ts">
  import AgGrid from "@michmich112/svelte-ag-grid";

  export let actionCreator: string;
  export let actionId: string;

  let data = [];

  const columnDefs = [
    { headerName: "ip", field: "ip" },
    { headerName: "timestamp", field: "timestamp", sortable: true },
  ];
</script>

<AgGrid bind:data {columnDefs} />

<style>
  :global(:root) {
    --grid-height: 500px;
  }
</style>
