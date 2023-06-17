<script>
  import logo from '/src/assets/lume-logo.png';
</script>

<header>
  <img src={logo} alt="Lume"/>
</header>

<style lang="scss">
  @import "/src/styles/mixins.scss";

  header {
    padding: 2.5em;
    color: #fff;
    background: #080808;
    border-bottom: 0.1em solid #363636;

    img {
      @include fluid-width-height(7.875rem, 2.625rem);
    }
  }
</style>
