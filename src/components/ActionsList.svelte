<script lang="ts">
  import { onMount } from "svelte";
  import { functions } from "../config/firebase.config";
  import { httpsCallable } from "firebase/functions";
  import ActionDataCard from "./ActionDataCard.svelte";
  import Loader from "./Loader.svelte";

  type Action = {
    creator: string;
    name: string;
    last_update: { _seconds: number; _nanoseconds: number };
  };

  let actions: Action[] = [];
  let loading: boolean = true;
  // let selected: number = 0;

  onMount(async () => {
    const getActions = httpsCallable<{}, Action[]>(functions, "getAction");
    actions = (await getActions()).data;
    loading = false;
  });
</script>

{#if loading}
  <div class="full">
    <Loader />
  </div>
{/if}
{#each actions as action}
  <ActionDataCard
    ActionRepoName={action.creator + "/" + action.name}
    LastUsedDate={action.last_update}
  />
{/each}

<style>
  .full {
    width: 100%;
    height: 100%;
  }
</style>
