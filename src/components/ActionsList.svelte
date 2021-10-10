<script lang="ts">
  import { onMount } from "svelte";
  import { functions } from "../config/firebase.config";
  import { httpsCallable } from "firebase/functions";
  import ActionDataCard from "./ActionDataCard.svelte";
  import Loader from "./Loader.svelte";
  import { appStore } from "../store";

  type Action = {
    creator: string;
    name: string;
    last_update: { _seconds: number; _nanoseconds: number };
  };

  let actions: Action[] = [];
  let loading: boolean = false;
  // let selected: number = 0;

  onMount(async () => {
    appStore.update((s) => ({ ...s, isLoading: true }));
    const getActions = httpsCallable<{}, Action[]>(functions, "getAction");
    actions = (await getActions()).data;
    appStore.update((s) => ({ ...s, isLoading: false }));
  });
</script>

{#if loading}
  <div class="full">
    <Loader />
  </div>
{/if}
{#each actions as action}
  <ActionDataCard
    ActionCreator={action.creator}
    ActionRepoName={action.name}
    LastUsedDate={action.last_update}
  />
{/each}

<style>
  .full {
    width: 100%;
    height: 100%;
  }
</style>
