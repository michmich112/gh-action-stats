<div class="body-container">
  <article id="271ece3e-afc9-48d7-8640-162613439de1" class="page sans">
    <header>
      <h1 class="page-title">Get Started</h1>
    </header>
    <div class="page-body">
      <h2 id="ee7f5e31-5fde-4653-b9dc-f13b0823ed39" class="">
        Collecting Data
      </h2>
      <blockquote id="155bc373-19a3-466f-b76b-1bd525d42e9e" class="">
        Note: Analytics can currently only be collected from js actions. Support
        for Docker actions may come in the future.
      </blockquote>
      <p id="d0241a27-2106-4177-a1b9-b2046e111c33" class="">
        To start collecting analytics data, install the <a
          href="https://www.npmjs.com/package/gh-action-stats"
          ><code>gh-action-stats</code></a
        > npm package as follows
      </p>
      <pre
        id="80ec8a6e-c5ab-4406-848b-d009d1778dc8"
        class="code"><code>npm i -S gh-action-stats</code></pre>
      <p id="68bca7a4-4451-4635-9de6-4ef677908aab" class="">
        You can then wrap your main function in the
        <code>collectStats</code> method as follows to start collecting stats.
      </p>
      <pre
        id="acbc0ad5-236d-4dfb-8fea-2d457361915d"
        class="code"><code>const collectStats = require(&#x27;gh-action-stats&#x27;);

/**
 * main function, it must not have any parameters
 * The main function can also be an async function
 */
function main() {'{'}
	// Your code goes here
  console.log(&#x27;This is the best GitHub action!&#x27;);
{'}'}

collectStats(main);</code></pre>
      <p id="6708d272-f62c-467c-8c6a-c0838e6ef84b" class="">
        Deploy it and run it on github actions to start collecting data.
      </p>
      <p id="2b6ebf5b-2241-465a-9e8d-f2caf16d3fa9" class="" />
      <h2 id="f0b91f9f-393a-4228-92de-128f3ed99581" class="">
        Login &amp; Dashboard
      </h2>
      <p id="44bee592-b903-4322-9263-c11982ef9d21" class="">
        Login is done through your Github account. You are automatically logged
        out.
      </p>
      <p id="d7d5d567-1a6e-42a0-a4ce-867a40ee11a7" class="">
        Only Github actions you own can be viewed at this time. The time of last
        use is displayed and you can access the dashboard for the select action
        by clicking on the card.
      </p>
      <blockquote id="7a2d89e9-b3aa-49a3-ba00-7fd8e1c0e8fd" class="">
        Note: Due to Google Functions cold start, this operation can be a bit
        slow currently.
      </blockquote>
      <figure id="dcebca3e-fd78-47a3-8e1e-9096c3ea5ff0" class="image">
        <img
          style="width:1140px"
          src="assets/images/Screen_Shot_2021-12-04_at_11.17.53_PM.png"
          alt="Actions List Dashboard Screenshot"
        />
      </figure>
      <p id="ebe9cc31-9d77-4d22-81d1-84f0a3a85d77" class="" />
      <h2 id="3c04152c-5fd2-4876-aaf3-f52dbea7f9f9" class="">
        Action Dashboard
      </h2>
      <p id="9a83bcee-d3db-4a8d-babc-86b2bbe2a028" class="">
        The action dashboard contains the information of the use of your Action.
        Aggregate data for total number of runs, individual actors and
        individual repositories are at the top of your dashboard along with the
        following graphs:
      </p>
      <ul id="d49f00af-809a-4553-af71-6c5027f7af52" class="bulleted-list">
        <li style="list-style-type:disc">Runs vs Time</li>
      </ul>
      <ul id="27ae179b-ae7c-4372-9e9f-9ee3b4f5f065" class="bulleted-list">
        <li style="list-style-type:disc">
          Individual actors &amp; Individual repos vs Time (individual actors
          and repo that used the action that specific day)
        </li>
      </ul>
      <p id="db0bccd2-e6fb-472d-9291-b081573a679a" class="">
        You also get the raw data in a table at the bottom.
      </p>
      <blockquote id="5845ecad-1d76-4503-9def-a76d331c132c" class="">
        ⚠️ Note: Private repos will be marked
        <code>true</code> in the <code>Repo Private</code> column and the name
        of the repo will be hashed as to ensure the privacy of the users. You
        still get access to the name of the organization that uses the action.
        If your Github account has access to the repo then the name will not be
        anonymized and <code>Repo Private</code> will be false as it is not private
        to you.
      </blockquote>
      <figure id="6ce1a885-7f96-4aed-9c38-2b09d39c0d5d" class="image">
        <a
          href="Get%20Started%20dcebca3efd7847a38e1e9096c3ea5ff0/Screen_Shot_2021-12-04_at_11.32.08_PM.png"
          ><img
            style="width:1470px"
            src="assets/images/Screen_Shot_2021-12-04_at_11.32.08_PM.png"
            alt="Actions Dashboard Screenshot"
          /></a
        >
      </figure>
      <p id="d06e8a66-9d5c-4c40-aa11-495c482e5b51" class="" />
      <h2 id="948c31e2-d7f4-40e1-a474-cf2955296eb1" class="">Going further</h2>
      <p id="e3ebaf69-3be2-454b-b2ba-ebdff85cffca" class="">
        We are continuing to add to the platform and are open to contributors!
        You can access the repos here:
      </p>
      <ul id="e6c5db79-b895-40d3-bc40-3775db2070db" class="bulleted-list">
        <li style="list-style-type:disc">
          <a href="https://github.com/michmich112/gh-action-stats"
            >gh-action-stats</a
          >
          (platform):
          <a href="https://github.com/michmich112/gh-action-stats"
            >https://github.com/michmich112/gh-action-stats</a
          >
        </li>
      </ul>
      <ul id="4244902b-eac2-45e1-b3f0-8be5d6d3512e" class="bulleted-list">
        <li style="list-style-type:disc">
          <a href="https://github.com/michmich112/gh-action-stats-js"
            >gh-action-stats-js
          </a>(npm package):
          <a href="https://github.com/michmich112/gh-action-stats-js"
            >https://github.com/michmich112/gh-action-stats-js</a
          >
        </li>
      </ul>
      <p id="b3b35ef5-b030-48e5-b527-0b8f29c2bc78" class="" />
    </div>
  </article>
</div>

<style>
  @media only screen {
    .body-container {
      margin: 2em auto;
      max-width: 900px;
    }
  }
  .body-container {
    line-height: 1.5;
    padding: 10px;
  }

  a {
    color: inherit;
    text-decoration: underline;
  }

  h1,
  h2 {
    letter-spacing: -0.01em;
    line-height: 1.2;
    font-weight: 600;
    margin-bottom: 0;
  }

  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 0.75em;
  }

  h1 {
    font-size: 1.875rem;
    margin-top: 1.87rem;
  }

  h2 {
    font-size: 1.5rem;
    margin-top: 1.5rem;
  }

  figure {
    margin: 1.25em 0;
    page-break-inside: avoid;
  }
  img {
    max-width: 100%;
  }

  @media only print {
    img {
      max-height: 100vh;
      object-fit: contain;
    }
  }

  @page {
    margin: 1in;
  }

  ul {
    margin: 0;
    margin-block-start: 0.6em;
    margin-block-end: 0.6em;
  }

  ul > li {
    list-style: disc;
  }
  ul {
    padding-inline-start: 1.7em;
  }

  ul > li {
    padding-left: 0.1em;
  }
  p {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .image {
    border: none;
    margin: 1.5em 0;
    padding: 0;
    border-radius: 0;
    text-align: center;
  }

  .code,
  code {
    background: rgba(135, 131, 120, 0.15);
    border-radius: 3px;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    tab-size: 2;
    overflow-x: scroll;
  }

  code {
    color: #eb5757;
  }

  .code {
    padding: 1.5em 1em;
  }

  .code > code {
    background: none;
    padding: 0;
    font-size: 100%;
    color: inherit;
  }

  blockquote {
    font-size: 1.25em;
    margin: 1em 0;
    padding-left: 1em;
    border-left: 3px solid rgb(55, 53, 47);
  }
  .sans {
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI",
      Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji",
      "Segoe UI Symbol";
  }
  .code {
    font-family: "SFMono-Regular", Menlo, Consolas, "PT Mono", "Liberation Mono",
      Courier, monospace;
  }
</style>
