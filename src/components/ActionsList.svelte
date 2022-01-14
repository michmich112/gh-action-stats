<script lang="ts">
  import { onMount } from "svelte";
  import { functions } from "../config/firebase.config";
  import { httpsCallable } from "firebase/functions";
  import ActionDataCard from "./ActionDataCard.svelte";
  import Loader from "./Loader.svelte";
  import { appStore } from "../store";
  import type Action from "../domain/types/Action";

  let actions: Action[] = [];
  let loading: boolean = false;
  // let selected: number = 0;

  onMount(async () => {
    appStore.update((s) => ({ ...s, isLoading: true }));
    const getActions = httpsCallable<{}, Action[]>(functions, "getActions");
    actions = (await getActions()).data;
    appStore.update((s) => ({ ...s, isLoading: false }));
  });
</script>

{#if loading}
  <div class="full">
    <Loader />
  </div>
{:else if actions.length > 0}
  {#each actions as action}
    <ActionDataCard ActionData={action} />
  {/each}
{:else}
  No Action Data Yet. Start collecting analytics by <a href='/get-started'>getting started</a>.
{/if}

<style>
  .full {
    width: 100%;
    height: 100%;
  }
</style>
