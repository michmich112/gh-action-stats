<script lang="ts">
  import GitHubAuth from "./GitHubAuth.svelte";
  import { userAuthStore, UserAuthStore } from "../store";
  import { navigate } from "svelte-routing";

  let name: string;
  let authenticated: boolean;
  userAuthStore.subscribe((userAuth: UserAuthStore) => {
    console.log("value changed");
    authenticated = userAuth.authenticated;
    name = userAuth?.github?.username;
  });
  $: topMargin = authenticated ? "98px" : "145px";
</script>

<nav style="--top-margin:{topMargin}">
  <ul>
    <li class="clickable no-padding" on:click={(_) => navigate("/")}>
      <img src="/favicon.png" width="45px" height="45px" alt="Logo" />
    </li>
    <li class="clickable hide-on-mobile" on:click={(_) => navigate("/")}>
      GitHub Actions Stats
    </li>
    <li class="clickable" on:click={(_) => navigate("/get-started")}>
      Get Started
    </li>
    {#if authenticated}
      <li class="right hide-on-mobile">{name}</li>
    {:else}
      <li class="full-width right no-padding">
        <div class="center"><GitHubAuth /></div>
      </li>
    {/if}
  </ul>
</nav>

<style>
  nav {
    position: fixed;
    width: 100%;
    height: 50px;
    z-index: 10;
  }

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #333;
  }

  li {
    float: left;
    display: block;
    color: white;
    text-align: center;
    padding: 14px 16px;
    text-decoration: none;
  }

  .no-padding {
    padding: 2px;
  }

  .clickable {
    cursor: pointer;
  }

  .right {
    float: right;
  }

  @media screen and (max-width: 500px) {
    nav {
      height: var(--top-margin);
    }

    li {
      float: none;
    }

    .hide-on-mobile {
      display: none;
    }

    .center {
      display: flex;
      width: 100%;
      justify-content: center;
      align-content: center;
      margin: 2px;
    }
    .full-width {
      width: 100%;
    }

    .right {
      float: none;
    }
  }
</style>
