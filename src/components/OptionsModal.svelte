<script lang="ts">
  export let owner: string;
  export let repo: string;

  const badges = [
    {
      title: "Runs",
      url: `https://actions.boringday.co/api/badge?owner=${owner}&repo=${repo}&metric=runs`,
    },
    {
      title: "Runs Per Month",
      url: `https://actions.boringday.co/api/badge?owner=${owner}&repo=${repo}&metric=runs-per-month`,
    },
    {
      title: "Repos",
      url: `https://actions.boringday.co/api/badge?owner=${owner}&repo=${repo}&metric=repos`,
    },
  ];
</script>

<h1>Badges</h1>
<div class="column-flex">
  {#each badges as { title, url }}
    <div class="column-flex">
      <h3>{title}</h3>
      <span style="align:right;width:100%">URL</span>
      <code>{url}</code>
      <span style="align:right;width:100%">Markdown</span>
      <code>{`![${title} badge](${url})`}</code>
      <div><img src={url} alt={`${title} Badge`} /></div>
    </div>
  {/each}
</div>

<style>
  h1 {
    align-items: center;
  }

  h1,
  h3 {
    margin-top: 5px;
    width: 100%;
  }
  code {
    padding: 5px 10px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 5px;
    word-wrap: break-word;
  }

  .column-flex {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
  }

  @media screen and (max-width: 500px) {
    .column-flex {
      align-items: unset;
    }
  }
</style>
