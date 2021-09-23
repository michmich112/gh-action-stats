<script lang="ts">
  import { userAuthStore, UserAuthStore } from "../store";

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
    <li>GitHub Actions Stats</li>
    {#if authenticated}
      <li class="right">{name}</li>
    {/if}
  </ul>
</nav>

<style>
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

  .right {
    float: right;
  }
</style>
