<script lang="ts">
  export let onClick: () => void;
  export let variant: "light" | "dark" = "dark";
</script>

<div class="gh-button" on:click={onClick}>
  <img src="/GitHub-Mark-Light-64px.png" alt="Github Logo" />
  <span>Sign in With GitHub</span>
</div>

<style>
  img {
    width: 30px;
    height: 30px;
  }

  .gh-button {
    width: 180px;
    display: flex;
    flex-direction: row;
    align-content: center;
    justify-content: space-between;
    padding: 5px 10px;
    background-color: #252a2d;
    border-radius: 5px;
    font-family: "Inter", sans-serif;
    font-size: 15px;
    letter-spacing: 0px;
    line-height: 1.2;
    color: #ffffff;
    align-items: center;
    cursor: pointer;
  }
</style>
