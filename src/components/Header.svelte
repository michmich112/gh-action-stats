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
</script>

<nav>
  <ul>
    <li class="clickable" on:click={(_) => navigate("/")}>
      GitHub Actions Stats
    </li>
    <li class="clickable" on:click={(_) => navigate("/get-started")}>
      Get Started
    </li>
    {#if authenticated}
      <li class="right">{name}</li>
    {:else}
      <div class="right"><GitHubAuth /></div>
    {/if}
  </ul>
</nav>

<style>
  nav {
    position: fixed;
    width: 100%;
    height: 50px;
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

  .clickable {
    cursor: pointer;
  }

  .right {
    float: right;
  }
</style>
