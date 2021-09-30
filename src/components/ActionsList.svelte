<script lang="ts">
  import { onMount } from "svelte";
  import { functions } from "../config/firebase.config";
  import { httpsCallable } from "firebase/functions";
  import ActionDataCard from "./ActionDataCard.svelte";

  type Action = {
    creator: string;
    name: string;
    last_update: Date;
  };

  let actions: Action[] = [];
  // let selected: number = 0;

  onMount(async () => {
    const getActions = httpsCallable<{}, Action[]>(functions, "getAction");
    actions = (await getActions()).data;
  });
</script>

{#each actions as action}
  <ActionDataCard
    ActionRepoName={action.creator + "/" + action.name}
    LastUsedDate={action.last_update}
  />
{/each}

<style>
  container {
    height: 100%;
    width: 100%;
    display: flex;
  }

  container-content {
    flex: 1;
    display: flex;
    overflow-y: scroll;
  }
</style>
