<script lang="ts">
  import "../../styles/global.scss";
  import Header from "./components/Header.svelte";
  import Art from "./components/Art.svelte";
  import { waitForConnected } from "../../../shared/util.ts";
  import { createClient } from "@lumeweb/kernel-network-registry-client";
  import Network from "./components/Network.svelte";
  import Footer from "./components/Footer.svelte";

  const networkClient = createClient();

  let connected = false;

  async function getNetworks() {
    let types = {};

    return new Promise((resolve) => {
      waitForConnected(async () => {
        connected = true;

        const allTypes = await networkClient.getTypes();

        for (const type of allTypes) {
          types[type] = await networkClient.getNetworksByType(type);
        }
      });

      resolve(types);
    });
  }
</script>

<main>
  <Header />
  <Art />
  <div class="content connected">
    {#await getNetworks() then types}
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
