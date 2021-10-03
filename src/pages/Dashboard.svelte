<script lang="ts">
  import { UserAuthStore, userAuthStore } from "../store";
  import ActionsList from "../components/ActionsList.svelte";

  let name: string;
  userAuthStore.subscribe((userAuth: UserAuthStore) => {
    if (userAuth.authenticated) {
      name = userAuth?.github?.username;
    }
  });
</script>

<main>
  Welcome to GitHub Actions Stats @{name}
</main>
<ActionsList />

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
</style>
