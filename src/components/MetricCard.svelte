<script lang="ts">
  export let label: string;
  export let value: string;
</script>

<card>
  <span class="card-label">{label}</span>
  <span class="card-value">{value}</span>
</card>

<style>
  card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    border: 2px solid #222;
    padding: 5px;
  }

  .card-label {
    font-family: "Roboto Mono", monospace;
    color: #000000;
  }

  .card-value {
    font-family: "Roboto Mono", monospace;
    color: #000000;
    font-size: 20px;
  }
</style>
