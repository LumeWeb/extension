<script>
  import '/src/styles/global.scss';
  import lumeLogo from '/src/assets/lume-logo.png';

  import svgGithub from '/src/assets/icon/github.svg?raw';
  import svgDiscord from '/src/assets/icon/discord.svg?raw';
  import svgTwitter from '/src/assets/icon/twitter.svg?raw';
  import svgFacebook from '/src/assets/icon/facebook.svg?raw';

  let step = 1;
  let userCount;

  setTimeout(() => {
    step = 2;
  }, 5000);

  setTimeout(() => {
    step = 3;
    userCount = '23k';
  }, 6000);

  setTimeout(() => {
    step = 4;
  }, 7000);
</script>

<header>
  <img src={lumeLogo} alt="Lume"/>
  <div class="status" class:step-2={step === 2} class:step-3={step === 3} class:step-4={step === 4}>
    <div class="network">
      <div class="connected">
        <span class="icon icon-success"></span>
        Lume Network
      </div>
      <div class="connecting">
        <span class="icon icon-wait icon-wait-yellow"></span>
        Lume Network
      </div>
    </div>
    <div class="user-count" class:user-count-hidden={!userCount}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
      {userCount}
    </div>
  </div>
</header>
<main class:step-2={step === 2} class:step-3={step === 3} class:step-4={step === 4}>
  <div class="art-wrapper">
    <div class="art-rotate">
      <div class="art">
        <div class="gradient-1"></div>
        <div class="gradient-2"></div>
        <div class="gradient-3"></div>
        <div class="gradient-4"></div>
      </div>
    </div>
  </div>
  <div class="loading-text">
    <div class="loading-text-connected">
      <h3>Network Ready</h3>
      <p>All networks sync’d and ready to go.</p>
    </div>
  </div>
  <div class="content">
    <h3>All set.</h3>
    <div class="content-grid">
      <div>
        <h4>Blockchain Networks</h4>
        <ul>
          <li class="success">
            <div class="network">
              <span class="icon icon-success"></span>
              HNS
            </div>
            <div class="status">
              Synced
            </div>
          </li>
          <li class="loading">
            <div class="network">
              <span class="icon icon-wait"></span>
              ENS
            </div>
            <div class="status">
              Syncing
            </div>
          </li>
          <li class="error">
            <div class="network">
              <span class="icon icon-error"></span>
              Arweave
            </div>
            <div class="status">
              Issue
            </div>
          </li>
        </ul>
      </div>
      <div>
        <h4>Content Networks</h4>
        <ul>
          <li class="success">
            <div class="network">
              <span class="icon icon-success"></span>
              IPFS
            </div>
            <div class="status">
              Connected
              <div class="user-count">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {userCount}
              </div>
            </div>
          </li>
          <li class="loading">
            <div class="network">
              <span class="icon icon-wait"></span>
              Arweave
            </div>
            <div class="status">
              Connecting
              <div class="user-count">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {userCount}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div class="socials">
    <a href="#" title="GitHub" class="github-logo">
      {@html svgGithub}
    </a>
    <a href="#" title="Discord" class="discord-logo">
      {@html svgDiscord}
    </a>
    <a href="#" title="Twitter" class="twitter-logo">
      {@html svgTwitter}
    </a>
    <a href="#" title="Facebook" class="facebook-logo">
      {@html svgFacebook}
    </a>
  </div>
</main>

<style lang="scss">
  @import "/src/styles/artwork.scss";
  @import "/src/styles/mixins.scss";
  @import "/src/styles/vars.scss";

  .icon {
    display: block;
    width: 1.125em;
    height: 1.125em;
    margin-right: 0.375em;
    @include fluid-font-size(1.125rem);

    &.icon-success {
      mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>');
      mask-size: 1.125em 1.125em;
      mask-repeat: no-repeat;
      mask-position: 50%;
      background-color: #68cc58;
    }

    &.icon-wait {
      background-image: url("/src/assets/wait-icon-orange.png");
      background-size: 1.125em 1.125em;
      background-repeat: no-repeat;
      background-position: 50%;
    }

    &.icon-wait-yellow {
      background-image: url("/src/assets/wait-icon-yellow.png");
    }

    &.icon-error {
      mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>');
      mask-size: 1.125em 1.125em;
      mask-repeat: no-repeat;
      mask-position: 50%;
      background-color: #cc1b50;
    }
  }

  header {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 3;

    .status {
      @include fluid-font-size(1.25rem);
      margin: -0.5em 0 -0.5em 1em;
      animation: 1000ms fade-in;

      > div {
        display: flex;
        align-items: center;
        justify-content: flex-end;
      }

      .network {
        display: grid;

        > div {
          grid-column-start: 1;
          grid-row-start: 1;
          display: flex;
          align-items: center;
          line-height: 1;
          white-space: nowrap;
          transition: opacity 500ms;
        }

        .connecting {
          color: #edca4f;
          z-index: 2;

          .icon {
            animation: 5000ms rotate-full;
          }
        }

        .connected {
          color: #64c555;
          z-index: 1;
          opacity: 0;
        }
      }

      .user-count {
        @include fluid-font-size(1rem);
        color: #8e8e8e;
        height: 1.5em;
        padding-top: 0.3em;
        transition: height 500ms, padding-top 500ms;
        overflow: hidden;

        &.user-count-hidden {
          height: 0;
          padding: 0;
        }

        svg {
          @include fluid-width-height(1rem, 1rem);
          margin-right: 0.3em;
        }
      }

      &.step-3, &.step-4 {
        .network {
          .connecting {
            z-index: 1;
            opacity: 0;
          }

          .connected {
            z-index: 2;
            opacity: 1;
          }
        }
      }
    }
  }

  main {
    position: relative;
    animation: 1000ms fade-in;
    display: flex;
    align-items: center;
  }

  .art-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -125%);
    transition: left 500ms, transform 500ms;
    z-index: -1;
  }

  .art-rotate {
    transform: rotate(-180deg);
    animation: 5000ms rotate;
    transition: transform 500ms;
  }

  .art {
    position: relative;
    @include fluid-width-height(9.0625rem, 9.0625rem);
    background-image: $lume-2-base64;
    background-size: cover;
    background-position: 50%;
    transition: width 500ms, height 500ms;

    > div {
      position: absolute;
      inset: 0;
      transition: opacity 500ms;
    }

    .gradient-1 {
      background: linear-gradient(272.67deg, #FF005C -27.49%, #0C0C0D 26.91%, #FF005C 49.4%, #ED6A5E 99.62%);
      z-index: -1;
    }

    .gradient-2 {
      background: conic-gradient(from 180deg at 50% 50%, #A67833 -15.8deg, #E91F1F 222.32deg, #A67833 344.2deg, #E91F1F 582.32deg);
      opacity: 0;
      z-index: -2;
    }

    .gradient-3 {
      background: conic-gradient(from -89.79deg at 50% 50%, #33A653 -15.8deg, #080808 222.32deg, #33A653 344.2deg, #080808 582.32deg);
      opacity: 0;
      z-index: -3;
    }

    .gradient-4 {
      background: conic-gradient(from 180deg at 50% 50%, #2F2F2F -15.8deg, #66D155 222.32deg, #2F2F2F 344.2deg, #66D155 582.32deg);
      opacity: 0;
      z-index: -4;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    max-width: 64em;
    margin-top: 14em;
    margin-bottom: 10em;
    @include fluid-position-left(68em, 58em);
    color: #fff;
    opacity: 0;
    transition: opacity 500ms;

    h3 {
      @include fluid-font-size(3.125rem);
      font-family: $font-family-jetbrains-mono;
      line-height: 110%;
      text-shadow: 0.017em 0.017em 0.034em #000;
    }

    h4 {
      @include fluid-font-size(1.5rem);
      line-height: 168%;
      text-shadow: 0.017em 0.017em 0.034em #000;
    }

    li {
      @include fluid-font-size(1.25rem);
      margin-top: 0.9em;

      .network {
        display: flex;
        align-items: center;
        margin-bottom: -0.2em;
      }

      .status {
        @include fluid-font-size(1rem);
        display: flex;
      }

      &.success {
        .status {
          color: #62c554;
        }
      }

      &.loading {
        .status {
          color: #fb891f;
        }
      }

      &.error {
        .status {
          color: #cc1b50;
        }
      }

      .user-count {
        @include fluid-font-size(1rem);
        color: #8e8e8e;
        display: flex;
        align-items: center;

        svg {
          @include fluid-width-height(1rem, 1rem);
          margin: 0 0.3em 0 1.2em;
        }
      }
    }
  }

  .content-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 4em;
    margin: 4em 0;

    @media screen and (min-width: 36rem) {
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 1fr;
      gap: 10em;
      margin-top: 3em;
    }

    @media screen and (max-width: 80rem) {
      > div {
        background: rgba(#080808, 0.7);
        border-radius: 0.5em;
        padding: 0.8em 1.5em 1em;
        margin: -0.8em -1.5em -1em;
      }
    }
  }

  .loading-text {
    display: none;
    text-align: center;

    .loading-text-connected {
      position: absolute;
      top: 50%;
      left: 75%;
      transform: translate(-50%, 0);
      opacity: 0;
      transition: top 500ms, left 500ms, transform 500ms, opacity 500ms;
    }

    h3 {
      @include fluid-font-size(3.125rem);
      font-family: $font-family-jetbrains-mono;
      line-height: 110%;
      text-shadow: 0.017em 0.017em 0.034em #000;
      color: #fff;
    }

    p {
      @include fluid-font-size(1.25rem);
      margin-top: 0.625em;
      line-height: 122%;
      color: #808080;
    }
  }

  .socials {
    position: absolute;
    bottom: 5em;
    left: 5em;
    display: flex;
    align-items: center;
    gap: 1.5em;
    margin: -0.5em;
    opacity: 0;
    transition: opacity 500ms;

    a {
      padding: 0.5em;
      color: #fff;
      transition: color 250ms;

      &:hover {
        color: #62c554;
      }
    }

    :global(svg) {
      @include fluid-width-height(2rem, 2rem);
    }

    @media screen and (max-width: 80rem) {
      background: rgba(#080808, 0.7);
      border-radius: 0.5em;
      padding: 1.25em 1.5em;
      margin: -1.25em -1.5em;
    }
  }

  main.step-2 {
    .art {
      .gradient-1 {
        opacity: 0;
      }

      .gradient-2 {
        opacity: 1;
      }
    }

    .loading-text {
      display: block;
    }
  }

  main.step-3 {
    .art {
      .gradient-1 {
        opacity: 0;
      }

      .gradient-3 {
        opacity: 1;
      }
    }

    .loading-text {
      display: block;

      .loading-text-connected {
        left: 50%;
        opacity: 1;
      }
    }
  }

  main.step-4 {
    .art-wrapper {
      top: 50%;
      left: -35em;
      transform: translate(0, -50%);
    }

    .art-rotate {
      transform: rotate(-151.13deg);
    }

    .art {
      @include fluid-width-height(72rem, 72rem);

      .gradient-1 {
        opacity: 0;
      }

      .gradient-4 {
        opacity: 1;
      }
    }

    .loading-text {
      display: block;

      .loading-text-connected {
        top: 0;
        left: -25%;
        transform: translate(-125%, 0);
        opacity: 0;
      }
    }

    .content {
      opacity: 1;
    }

    .socials {
      opacity: 1;
    }
  }

  @keyframes fade-in {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes rotate {
    0% {
      transform: rotate(127.54deg);
    }

    20% {
      transform: rotate(127.54deg);
    }

    30% {
      transform: rotate(420deg);
    }

    50% {
      transform: rotate(420deg);
    }

    60% {
      transform: rotate(360deg);
    }

    90% {
      transform: rotate(360deg);
    }

    100% {
      transform: rotate(540deg);
    }
  }

  @keyframes rotate-full {
    0% {
      transform: rotate(-52.46deg);
    }

    20% {
      transform: rotate(-52.46deg);
    }

    30% {
      transform: rotate(240deg);
    }

    50% {
      transform: rotate(240deg);
    }

    60% {
      transform: rotate(180deg);
    }

    90% {
      transform: rotate(180deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
</style>
