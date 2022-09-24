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
  <footer class="footer">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      <a class="link" href="https://github.com/michmich112/gh-action-stats" target="_blank" rel="noreferrer">gh-action-stats (platform):</a>
      <a class="link1" href="https://github.com/michmich112/gh-action-stats" target="_blank" rel="noreferrer">https://github.com/michmich112/gh-action-stats</a>
  </footer>
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
  .footer {
    display: flex;
    justify-content: flex-start;
    padding: 2rem;
  }
  .link {
    color: #000;
    font-weight: 500;
    margin-left: 1rem;
    transition: all 0.3s ease-in;
  }
  .link1 {
    color: #000;
    font-weight: 500;
    margin-left: 1rem;
    transition: all 0.3s ease-in;
  }
  .link:hover {
    color: #023e8a;
  }
  .link1:hover {
    color: #023e8a;
  }
</style>
