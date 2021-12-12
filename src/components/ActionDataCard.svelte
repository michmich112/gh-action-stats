<script lang="ts">
  import { Timestamp } from "firebase/firestore";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import axios from "axios";
  import type Action from "../domain/types/Action";

  export let ActionData: Action;

  $: lastDate = new Timestamp(
    ActionData.last_update._seconds,
    ActionData.last_update._nanoseconds
  ).toDate();

  $: repoName = ActionData.creator + "/" + ActionData.name;

  function goToAction() {
    navigate(`/action/${ActionData.creator}/${ActionData.name}`);
  }

  onMount(() => {
    if (new Date(Date.parse(ActionData.badges.last_update)).getTime() === 0) {
      axios
        .get("https://actions.boringday.co/api/badge", {
          params: {
            owner: ActionData.creator,
            repo: ActionData.name,
            metric: "runs",
          },
        })
        .then(() => {
          console.log(
            `Initialized Action Badges ${ActionData.creator}/${ActionData.name}`
          );
        })
        .catch(() => {
          console.log(
            `Initialized Action Badges ${ActionData.creator}/${ActionData.name}`
          );
        });
    }
  });
</script>

<card on:click={goToAction}>
  <span class="info-text">{repoName}</span>
  <span class="info-text">Last Used: {lastDate.toLocaleString()}</span>
</card>

<style>
  card {
    box-sizing: border-box;
    margin: 5px 15px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 1em;
    overflow: hidden;
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
    font-size: 15px;
    letter-spacing: 0px;
    line-height: 1.2;
    cursor: pointer;
  }

  card:hover > .info-text {
    color: #ffffff;
  }

  @media only screen and (max-width: 800px) {
    card {
      box-sizing: border-box;
      margin: 5px 15px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 1em;
      overflow: hidden;
      border-radius: 10px;
      border: 3px solid #222;
      cursor: pointer;
    }
    .info-text {
      font-size: max(3.2vw, 12px);
    }
  }
</style>
