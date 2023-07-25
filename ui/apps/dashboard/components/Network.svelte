<script>
  import { onDestroy, onMount } from "svelte";
  import { getNetworkModuleStatus } from "@lumeweb/libkernel";

  export let module;

  let destroy;

  let ready = false;
  let sync = null;
  let peers = 0;

  onMount(() => {
    destroy = getNetworkModuleStatus((data) => {
      ready = data.ready;
      sync = data.sync;
      peers = data.peers;
    }, module);
  });
  onDestroy(() => {
    destroy?.();
  });
</script>

<li class:success={ready}>
  <div class="network">
    <span class="icon" class:icon-success={ready} />
    Network
  </div>
  {#if ready}
    <div class="status">Synced</div>
  {:else}
    <div class="status">Syncing</div>
  {/if}
</li>
