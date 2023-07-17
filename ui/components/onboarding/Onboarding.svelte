<script>
  import '../../styles/global.scss';
  import lumeLogo from '../../assets/lume-logo.png';

  let started = false;
  let step = 1;

  const start = () => {
    started = true;
    step = 2;
  };

  const prev = () => {
    step--;
  };

  const next = () => {
    step++;
  };

  const redirect = () => {
    window.location.href = '/account.html';
  };
</script>

<header>
  <img src={lumeLogo} alt="Lume"/>
</header>
<main class:started={started} class:step-2={step === 2} class:step-3={step === 3} class:step-4={step === 4}>
  <div class="art art-1"></div>
  <div class="art art-2"></div>
  <div class="art art-3"></div>
  <div class="art art-4"></div>
  <div class="content">
    <div>
      <div class="page content-1">
        <h1>Thank you for supporting an open web.</h1>
        <p>We are an independent, pure organization. We have decided not to take money from venture capitalists. Nor do we have a large treasury funding our work.</p>
        <div class="btn-wrapper">
          <button class="btn-main" on:click={() => start()}>Begin</button>
        </div>
      </div>
      <div class="page content-2">
        <h1>Gateway for easy access to the open web.</h1>
        <p>Easy Access to Web3. With native Handshake (HNS) and Ethereum (ENS) support, you can forget eth.link and hns.is. This is your gateway.</p>
        <div class="btn-wrapper">
          <button class="btn-main btn-black" on:click={() => redirect()}>Skip</button>
          <button class="btn-main" on:click={() => next()}>Next</button>
        </div>
      </div>
      <div class="page content-3">
        <h1>Universal storage drive slide.</h1>
        <p>Stop worrying about being vendor-locked. Remain flexible and reduce your storage costs by 50% or more. Lume is affordable storage on-demand.</p>
        <div class="btn-wrapper">
          <button class="btn-main btn-black" on:click={() => prev()}>Back</button>
          <button class="btn-main" on:click={() => next()}>Next</button>
        </div>
      </div>
      <div class="page content-4">
        <h1>Create decentralized websites.</h1>
        <p>Stop worrying about being vendor-locked. Remain flexible and reduce your storage costs by 50% or more. Lume is affordable storage on-demand. Stop worrying about being vendor-locked.</p>
        <div class="btn-wrapper">
          <button class="btn-main btn-black" on:click={() => prev()}>Back</button>
          <button class="btn-main btn-green" on:click={() => redirect()}>Get started</button>
        </div>
      </div>
    </div>
    <div class="grant-info">
      Lume is a 503c Grant recepient, <a href="https://lumeweb.com">learn more</a> about the work we’re doing to provide accessible access to the open web for everyone.
    </div>
  </div>
</main>

<style lang="scss">
  @import "../../styles/mixins";
  @import "../../styles/vars";

  main {
    position: relative;
    background: #080808;
  }

  .art, .content {
    position: absolute;
    top:0;
    bottom: 0;
    width: 50%;
  }

  .art-1 {
    left: 0;
    background-image: url("../../assets/onboarding-1.jpg");
    background-position: 50%;
    background-size: cover;
    border-right: 1px solid #363636;
  }

  .art-2 {
    left: 50%;
    background-image: url("../../assets/onboarding-2.jpg");
    background-position: 50%;
    background-size: cover;
    border-left: 1px solid #363636;
    opacity: 0;
  }

  .art-3 {
    left: 50%;
    background-image: url("../../assets/onboarding-3.jpg");
    background-position: 50%;
    background-size: cover;
    border-left: 1px solid #363636;
    opacity: 0;
    transition: opacity 250ms;
  }

  .art-4 {
    left: 50%;
    background-image: url("../../assets/onboarding-4.jpg");
    background-position: 50%;
    background-size: cover;
    border-left: 1px solid #363636;
    opacity: 0;
    transition: opacity 250ms;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    left: 50%;
    padding: 5.5em 3.75%;
    color: #fff;
    background: #080808;
    transition: left 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: auto;

    > div:first-child {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 43.2em;
    }
  }

  .page {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 42em;
  }

  h1 {
    font-family: $font-family-jetbrains-mono;
    @include fluid-font-size(3.125rem);
    line-height: 110%;
  }

  p {
    @include fluid-font-size(1.25rem);
    margin-top: 1.4em;
    line-height: 122%;
    color: #808080;
  }

  .btn-wrapper {
    margin-top: 5.5em;
  }

  .grant-info {
    @include fluid-font-size(1rem);
    margin-top: 5em;
    max-width: 27em;
    line-height: 125%;
    color: #808080;

    a {
      color: #fff;
    }
  }

  .content-2, .content-3, .content-4 {
    display: none;
  }

  .started {
    .art-1 {
      opacity: 0;
    }

    .content {
      left: 0;
    }

    .content-1 {
      display: none;
    }
  }

  .step-2 {
    .art-2 {
      opacity: 1;
    }

    .content-2 {
      display: flex;
    }
  }

  .step-3 {
    .art-3 {
      opacity: 1;
    }

    .content-3 {
      display: flex;
    }
  }

  .step-4 {
    .art-4 {
      opacity: 1;
    }

    .content-4 {
      display: flex;
    }
  }

  @media screen and (max-width: 48rem) {
    .art {
      display: none;
    }

    .content {
      left: 0;
      width: 100%;
      transition: none;
    }
  }
</style>
