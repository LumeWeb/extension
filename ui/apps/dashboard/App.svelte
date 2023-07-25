<script lang="ts">
  import Header from "./components/Header.svelte";
  import Art from "./components/Art.svelte";
  import { waitForConnected } from "../../../shared/util.ts";
  import { createClient } from "@lumeweb/kernel-network-registry-client";
  import Network from "./components/Network.svelte";
  import Footer from "./components/Footer.svelte";

  const networkClient = createClient();

  let connected = false;

  let types = {};

  const waitConnect = waitForConnected(async () => {
    connected = true;

    const types = await networkClient.getTypes();

    for (const type of types) {
      types[type] = await networkClient.getNetworksByType();
    }
  });
</script>

<main>
  <Header />
  <Art />
  <div class="content" class:connected>
    {#await waitConnect}
      <div class="content-grid">
        {#each Object.entries(types) as [type, networks]}
          <div>
            <h4>{type} Networks</h4>
            <ul>
              {#each networks as network}
                <Network module={network} />
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    {/await}
  </div>
  <Footer />
</main>

<style lang="scss">
  @import "App.scss";
</style>
