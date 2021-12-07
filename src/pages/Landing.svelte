<script lang="ts">
  import GitHubAuth from "../components/GitHubAuth.svelte";
  import { navigate } from "svelte-routing";
  import { UserAuthStore, userAuthStore } from "../store";

  let authenticated: boolean = false;

  userAuthStore.subscribe((userAuth: UserAuthStore) => {
    authenticated = userAuth.authenticated;
  });
</script>

<div class="main">
  <div class="horizontal-grid">
    <div>
      <h1>Get detailed analytics from your GitHub actions.</h1>
      <h2>
        Know who uses your action, errors, and more to make your action better
        for all
      </h2>
    </div>
    <img
      class="half-width"
      src="assets/images/Screen_Shot_2021-12-04_at_11.32.08_PM.png"
      alt="Actions Dashboard Screenshot"
    />
  </div>
  <div class="vertical-grid">
    {#if !authenticated}
      <GitHubAuth />
      <h1>Or</h1>
    {/if}
    <button on:click={() => navigate("/get-started")}> Get Started </button>
  </div>
</div>

<style>
  .half-width {
    width: 45%;
  }

  .horizontal-grid {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    text-align: start;
  }
  @media only screen and (max-width: 500px) {
    .half-width {
      width: 85%;
    }
    .horizontal-grid {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
  }

  .vertical-grid {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .main {
    text-align: center;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1em;
    padding: 0px 10px;
  }
</style>
