<script>
  import { waitForConnected } from "../../../../shared/util.ts";

  let connected = false;
  let pulse = false;

  waitForConnected(() => {
    connected = true;
  });
</script>

<div class="art-wrapper" class:pulse class:connected>
  <div class="art-rotate">
    <div class="art">
      <div class="gradient-1" />
      <div class="gradient-2" />
      <div class="gradient-3" />
      <div class="gradient-4" />
    </div>
  </div>
</div>

<style lang="scss">
  @import "Art.scss";
</style>
