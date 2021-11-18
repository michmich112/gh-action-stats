<script lang="ts">
  import { Timestamp } from "firebase/firestore";
  import { navigate } from "svelte-routing";

  export let ActionCreator: string;
  export let ActionRepoName: string;
  export let LastUsedDate: { _seconds: number; _nanoseconds: number };

  $: lastDate = new Timestamp(
    LastUsedDate._seconds,
    LastUsedDate._nanoseconds
  ).toDate();

  $: repoName = ActionCreator + "/" + ActionRepoName;

  function goToAction() {
    navigate(`/action/${ActionCreator}/${ActionRepoName}`);
  }
</script>

<card on:click={goToAction}>
  <span class="info-text">{repoName}</span>
  <span class="info-text">Last Used: {lastDate.toLocaleString()}</span>
</card>

<style>
  card {
    box-sizing: border-box;
    margin: 5px 15px;
    height: 60px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 17px;
    overflow: visible;
    border-radius: 10px;
    border: 3px solid #222;
    cursor: pointer;
  }

  card:hover {
    background-color: #252a2d;
  }

  .info-text {
    width: auto;
    height: auto;
    flex-shrink: 0;
    overflow: visible;
    white-space: pre;
    font-weight: 600;
    font-style: normal;
    font-family: "Roboto Mono", monospace;
    color: #000000;
    font-size: 20px;
    letter-spacing: 0px;
    line-height: 1.2;
    cursor: pointer;
  }

  card:hover > .info-text {
    color: #ffffff;
  }
</style>
