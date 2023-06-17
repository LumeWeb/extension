<script>
  import { onMount } from 'svelte';

  import * as bip39 from '@scure/bip39';
  import { wordlist } from '@scure/bip39/wordlists/english';

  import '/src/styles/global.scss';
  import Header from '/src/components/Header.svelte';

  let action;
  let createAccountStep;
  let fadeOut;

  let elContentTextWrapper;
  let elContentTextDefault;
  let elContentTextCreateAccount;
  let elContentTextShowKey;
  let elContentTextActive;

  let elSwitch;
  let elSwitchDefault;
  let elSwitchShowKey;

  let inputKey;
  let inputKeyRef;
  let generatedKey;

  let copyKeyTimeout;
  let copyKeyCallback;
  let copyKeySuccess;
  let copyKeyError;
  const copyKeyButtonTextDefault = 'Copy Account Key';
  const copyKeyButtonTextSuccess = 'Account Key Copied';
  const copyKeyButtonTextError = 'Account Key Copy Failed';
  let copyKeyButtonText = copyKeyButtonTextDefault;

  onMount(() => {
    elContentTextWrapper = document.getElementById('content-text-wrapper');
    elContentTextDefault = document.getElementById('content-text-default');
    elContentTextCreateAccount = document.getElementById('content-text-create-account');
    elContentTextShowKey = document.getElementById('content-text-show-key');

    elSwitch = document.getElementById('switch');
    elSwitchDefault = document.getElementById('switch-default');
    elSwitchShowKey = document.getElementById('switch-show-key');

    let resizeTimeout;

    const onResize = () => {
      clearTimeout(resizeTimeout);

      resizeTimeout = setTimeout(() => {
        setContentTextHeight(elContentTextActive);
      }, 25);
    };

    window.addEventListener('resize', onResize);
  });

  const setContentTextHeight = element => {
    elContentTextActive = element;
    elContentTextWrapper.style.height = element.offsetHeight + 'px';
  };

  const setAction = value => {
    action = value;

    if(!elContentTextActive) {
      elContentTextDefault.style.position = 'absolute';
      setContentTextHeight(elContentTextDefault);
    }

    setTimeout(() => {
      if((!value || value === 'sign-in') && elContentTextActive !== elContentTextDefault) {
        setContentTextHeight(elContentTextDefault);
      } else if(value === 'create-account' && elContentTextActive !== elContentTextCreateAccount) {
        setContentTextHeight(elContentTextCreateAccount);
      }
    }, 0);
  };

  const signIn = () => {
    setAction('sign-in');

    inputKeyRef.focus();
  };

  const inputKeySignIn = () => {
    if(!bip39.validateMnemonic(inputKey, wordlist)) {
      alert('invalid key');
      return;
    }

    processSignIn(inputKey);
  };

  const createAccount = () => {
    setAction('create-account');
    createAccountStep = 1;
  };

  const createAccountBack = () => {
    createAccountStep = 1;
  };

  const createAccountCancel = () => {
    setAction();
    createAccountStep = undefined;
  };

  const createAccountReady = () => {
    if(createAccountStep !== 1) {
      return;
    }

    createAccountStep = 2;
  };

  const showKey = () => {
    if(createAccountStep !== 2) {
      return;
    }

    // generate key
    generatedKey = bip39.generateMnemonic(wordlist).split(' ');

    createAccountStep = 3;
    elSwitch.style.height = elSwitchDefault.offsetHeight + 'px';
    elSwitchDefault.style.position = 'absolute';

    setTimeout(() => {
      setContentTextHeight(elContentTextShowKey);
      elSwitch.style.height = elSwitchShowKey.offsetHeight + 'px';

      elSwitch.addEventListener('transitionend', event => {
        if(event.target !== elSwitch) {
          return;
        }

        elSwitchShowKey.style.position = 'static';
        elSwitch.style.height = '';
      });
    }, 0);
  };

  const showKeyWarning = () => {
    if(createAccountStep !== 3) {
      return;
    }

    createAccountStep = 4;
  };

  const copyKey = () => {
    clearTimeout(copyKeyTimeout);

    navigator.clipboard.writeText(generatedKey.join(' ')).then(() => {
      if(copyKeyCallback) {
        copyKeyCallback();
      }

      copyKeySuccess = true;
      copyKeyButtonText = copyKeyButtonTextSuccess;

      copyKeyCallback = () => {
        copyKeyCallback = undefined;
        copyKeySuccess = undefined;
        copyKeyButtonText = copyKeyButtonTextDefault;
      };

      copyKeyTimeout = setTimeout(copyKeyCallback, 5000);
    }).catch(error => {
      console.error(error);

      if(copyKeyCallback) {
        copyKeyCallback();
      }

      copyKeyError = true;
      copyKeyButtonText = copyKeyButtonTextError;

      copyKeyCallback = () => {
        copyKeyCallback = undefined;
        copyKeyError = undefined;
        copyKeyButtonText = copyKeyButtonTextDefault;
      };

      copyKeyTimeout = setTimeout(copyKeyCallback, 5000);
    });
  };

  const generatedKeySignIn = () => {
    const key = generatedKey.join(' ');

    if(!bip39.validateMnemonic(key, wordlist)) {
      alert('invalid key');
      return;
    }

    processSignIn(key);
  };

  const processSignIn = key => {
    fadeOut = true;

    // use key here

    window.setTimeout(() => {
      alert('redirect to dashboard');
    }, 1000);
  };
</script>

<Header />
<main class:sign-in={action === 'sign-in'} class:create-account={action === 'create-account'} class:create-account-step-2={createAccountStep === 2} class:create-account-step-3={createAccountStep === 3} class:create-account-step-4={createAccountStep === 4} class:fade-out={fadeOut}>
  <div class="art">
    <div class="gradient-1"></div>
    <div class="gradient-2"></div>
    <div class="gradient-3"></div>
  </div>
  <div class="content">
    <div>
      <div>
        <div id="content-text-wrapper">
          <div id="content-text-default">
            <h1>Access the open web with ease</h1>
            <p>Seamless access to the open web with Lume, integrated Handshake (HNS) and Ethereum (ENS) Support.</p>
          </div>
          <div id="content-text-create-account">
            <h1>Set up your account key</h1>
            <p>Let’s create your account key or seed phrase. This phrase will be used to access your Lume account. Make sure to keep it safe at all times.</p>
          </div>
          <div id="content-text-show-key">
            <h1>Here’s your account key</h1>
            <p>Make sure to keep it safe at all times.</p>
          </div>
        </div>
        <div id="switch">
          <div id="switch-default">
            <div class="content-action-wrapper">
              <div class="content-action-sign-in">
                <div class="content-action-inner">
                  <div class="btn-wrapper sign-in-btn">
                    <button class="btn-main btn-black" on:click={() => signIn()}>Sign in with Account Key</button>
                  </div>
                  <div class="sign-in-form">
                    <div class="input-wrapper">
                      <input bind:this={inputKeyRef} type="text" bind:value={inputKey} placeholder="Insert your 12-word account key here" />
                    </div>
                    <div class="btn-wrapper">
                      <button class="btn-main btn-green" on:click={() => inputKeySignIn()}>Login</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="content-action-create-account">
                <div class="content-action-inner">
                  <div class="btn-wrapper create-account-ready-btn">
                    <button class="btn-main btn-green" on:click={() => createAccountReady()}>I get it, I’ll keep it safe. Let’s see the key.</button>
                  </div>
                  <div class="create-account-ready">
                    <div class="warning">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <div>Should you lose this key, you will be forced to create a new account.</div>
                    </div>
                    <div class="btn-wrapper create-account-show-key-btn">
                      <button class="btn-main" on:click={() => showKey()}>I’m ready, show me the key</button>
                    </div>
                    <div class="btn-wrapper create-account-back-btn">
                      <button on:click={() => createAccountBack()}>
                        <span>Go back</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="separator">
              <span>OR</span>
            </div>
            <div class="btn-stack">
              <div class="btn-wrapper create-account-btn">
                <button class="btn-main btn-green" on:click={() => createAccount()}>Create an Account</button>
              </div>
              <div class="btn-wrapper create-account-gray-btn">
                <button class="btn-main btn-black gray-text" on:click={() => createAccount()}>Create an Account</button>
              </div>
              <div class="btn-wrapper create-account-cancel-btn">
                <button class="btn-main btn-black gray-text" on:click={() => createAccountCancel()}>Go back</button>
              </div>
            </div>
          </div>
          <div id="switch-show-key">
            {#if createAccountStep > 2}
              <div class="show-key-wrapper">
                <div class="show-key-grid">
                  {#each generatedKey as word, index}
                    <div>
                      <span>{index + 1}</span>
                      {word}
                    </div>
                  {/each}
                </div>
                <div class="warning">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>Make sure to write this key down for safe keeping.</div>
                </div>
                <div class="btn-wrapper show-key-copy-btn">
                  <button class="btn-main btn-black" on:click={() => copyKey()} class:success={copyKeySuccess} class:error={copyKeyError}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                    {copyKeyButtonText}
                  </button>
                </div>
                <div class="btn-stack">
                  <div class="btn-wrapper show-key-continue-btn">
                    <button class="btn-main" on:click={() => showKeyWarning()}>Continue</button>
                  </div>
                  <div class="btn-wrapper show-key-login-btn">
                    <button class="btn-main btn-green" on:click={() => generatedKeySignIn()}>Login</button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div class="grant-info">
      Lume is a 503c Grant recepient, <a href="https://lumeweb.com">learn more</a> about the work we’re doing to provide accessible access to the open web for everyone.
    </div>
  </div>
</main>

<style lang="scss">
  @import "/src/styles/artwork.scss";
  @import "/src/styles/mixins.scss";
  @import "/src/styles/vars.scss";

  main {
    position: relative;
    transition: opacity 1000ms;

    &.fade-out {
      opacity: 0;
      pointer-events: none;
    }
  }

  .art, .content {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
  }

  .art {
    left: 0;
    background-image: $lume-base64; // embedded base64 instead of remote image to circumvent loading delay, subject to optimization (bg color)
    background-size: cover;
    background-position: 50%;
    border-right: 1px solid #363636;

    > div {
      position: absolute;
      inset: 0;
      transition: opacity 500ms;
    }

    .gradient-1 {
      background: linear-gradient(272.67deg, #1FC3F7 -27.49%, #33A653 49.4%, #62C554 87.63%);
      z-index: -1;
    }

    .gradient-2 {
      background: conic-gradient(from 180deg at 50% 50%, #33A653 -15.8deg, #080808 222.32deg, #33A653 344.2deg, #080808 582.32deg);
      opacity: 0;
      z-index: -2;
    }

    .gradient-3 {
      background: linear-gradient(272.67deg, #ED6A5E -27.49%, #0C0C0D 26.91%, #33A653 49.4%, #ED6A5E 99.62%);
      opacity: 0;
      z-index: -3;
    }
  }

  main.sign-in, main.create-account {
    .art {
      .gradient-1 {
        opacity: 0;
      }

      .gradient-2 {
        opacity: 1;
      }
    }
  }

  main.create-account-step-4 {
    .art {
      .gradient-2 {
        opacity: 0;
        transition-delay: 4500ms;
      }

      .gradient-3 {
        opacity: 1;
        transition-delay: 4500ms;
      }
    }
  }

  .content {
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 5.5em 3.75%;
    color: #fff;
    background: #080808;
    overflow: auto;

    > div:first-child {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      max-width: 45.8em;

      > div {
        flex-grow: 1;
      }
    }

    > div.grant-info {
      @include fluid-font-size(1rem);
      margin-top: 5em;
      max-width: 28.625em;
      line-height: 125%;
      color: #808080;
      transition: opacity 500ms;

      a {
        color: #fff;
      }
    }
  }

  h1 {
    @include fluid-font-size(3.125rem);
    font-family: $font-family-jetbrains-mono;
    line-height: 110%;
    text-shadow: 0.017em 0.017em 0.034em #000;
  }

  p {
    @include fluid-font-size(1.25rem);
    margin-top: 1.4em;
    line-height: 122%;
    color: #808080;
  }

  #content-text-wrapper {
    position: relative;
    margin-bottom: 3.2em;
    transition: height 500ms, opacity 500ms;

    > div {
      top: 0;
      left: 0;
      right: 0;
      transition: opacity 500ms;
    }
  }

  #content-text-default {
    z-index: 2;
  }

  #content-text-create-account, #content-text-show-key {
    position: absolute;
    opacity: 0;
    z-index: 1;
  }

  #switch {
    position: relative;
    transition: height 500ms;

    > div {
      top: 0;
      left: 0;
      right: 0;
      transition: opacity 500ms;
    }
  }

  #switch-show-key {
    position: absolute;
    opacity: 0;
    z-index: -1;
  }

  .warning {
    display: flex;
    align-items: center;
    gap: 2em;
    color: #e15858;

    svg {
      flex-shrink: 0;
      @include fluid-width-height(3.5rem, 3.5rem);
      margin-bottom: -0.5em;
    }

    div {
      @include fluid-font-size(1.25rem);
      line-height: 122%;
    }
  }

  .content-action-wrapper {
    position: relative;
    height: 6.2em;
    transition: height 500ms, margin-bottom 500ms;
    transition-timing-function: cubic-bezier(0.68, -0.6, 0.32, 1.6);
  }

  .content-action-sign-in {
    position: absolute;
    inset: 0;
    transition: opacity 500ms;

    .content-action-inner {
      position: relative;

      .sign-in-btn {
        transition: opacity 250ms;
      }

      .sign-in-form {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        opacity: 0;
        transition: opacity 250ms 250ms;
        z-index: -1;

        .input-wrapper {
          display: flex;
          height: 6.2em;

          input {
            box-sizing: content-box;
            flex: 1;
            display: inline-block;
            @include fluid-font-size(1.25rem);
            height: 1em;
            padding: 1em;
            background: #080808;
            border: 0.05em solid #777;
            border-radius: 0.25em;
            text-align: center;
            transition: border-color 250ms;

            &::placeholder {
              color: #808080;
            }

            &:hover {
              border-color: #a1a1a1;
            }

            &:focus {
              outline: none;
              border-color: #fff;
            }
          }
        }

        .btn-wrapper {
          margin-top: 3em;
        }
      }
    }
  }

  .content-action-create-account {
    position: absolute;
    inset: 0;
    transition: opacity 500ms;
    opacity: 0;
    z-index: -1;

    .content-action-inner {
      position: relative;

      .create-account-ready-btn {
        transition: opacity 250ms;
      }

      .create-account-ready {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        opacity: 0;
        transition: opacity 250ms;
        z-index: -1;
      }

      .warning {
        height: 5.6em;
        margin-top: 2em;
      }

      .create-account-show-key-btn {
        margin-top: 4em;

        button {
          position: relative;
          padding-right: 4.1em;
          overflow: hidden;

          &::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            width: 3.1em;
            color: #fff;
            background-color: #62c554;
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>');
            background-size: 1.125em 1.125em;
            background-repeat: no-repeat;
            background-position: 50%;
            transition: background-color 500ms;
          }

          &:hover::after {
            background-color: #6ee65d;
          }
        }
      }

      .create-account-back-btn {
        margin-top: 2em;

        button {
          @include fluid-font-size(1.125rem);
          line-height: 1;
          color: #fff;
          padding: 1.25em;

          span {
            background: #080808;
            padding: 0 0.75em;
          }
        }
      }
    }
  }

  .separator {
    position: relative;
    height: 1px;
    background: #62c554;
    margin: 4.5em 0;
    transition: background 500ms, opacity 500ms;

    span {
      @include fluid-font-size(1.25rem);
      display: inline-block;
      position: absolute;
      left: 50%;
      top: 50%;
      padding: 0 0.75em;
      color: #62c554;
      background: #080808;
      transform: translate(-50%, -50%);
      transition: color 500ms;
    }
  }

  .btn-stack {
    display: grid;
    transition: opacity 500ms;

    > div {
      grid-column-start: 1;
      grid-row-start: 1;
      transition: opacity 500ms;
    }
  }

  .create-account-btn {
    opacity: 1;
    z-index: 2;
  }

  .create-account-gray-btn, .create-account-cancel-btn {
    opacity: 0;
    z-index: 1;
  }

  .show-key-wrapper {
    .warning {
      height: 0;
      margin: 1.6em 0;
      opacity: 0;
      transition: height 500ms, margin 500ms, opacity 500ms;
    }

    .show-key-copy-btn button {
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        @include fluid-width-height(1.75rem, 1.75rem);
        margin: -50% 0.625em -50% 0;
        color: #d9d9d9;
        transition: color $transition-duration;
      }

      &:hover {
        svg {
          color: inherit;
        }
      }

      &.success {
        color: #62c554;
        border-color: #62c554;

        svg {
          color: #62c554;
        }
      }

      &.error {
        color: #f66060;
        border-color: #f66060;

        svg {
          color: #f66060;
        }
      }
    }

    .btn-stack {
      margin-top: 1.8em;
    }
  }

  .show-key-continue-btn {
    z-index: 2;
  }

  .show-key-login-btn {
    z-index: 1;
    opacity: 0;
  }

  .show-key-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6em;

    > div {
      position: relative;
      @include fluid-font-size(1.25rem);
      line-height: 1;
      padding: 0.8em 0.8em 0.8em 1.6em;
      border: 0.05em solid #444;
      border-radius: 0.25em;

      span {
        position: absolute;
        @include fluid-font-size(1rem);
        top: 0.5em;
        left: 0.5em;
        color: #969696;
      }
    }
  }

  main.sign-in {
    .content-action-wrapper {
      height: 15.4em;
    }

    .content-action-sign-in {
      .sign-in-btn {
        opacity: 0;
      }

      .sign-in-form {
        z-index: 1;
        opacity: 1;
      }
    }

    .separator {
      background: #777;

      span {
        color: #777;
      }
    }

    .create-account-btn {
      opacity: 0;
      z-index: 1;
    }

    .create-account-gray-btn {
      opacity: 1;
      z-index: 2;
    }
  }

  main.create-account {
    #content-text-default {
      opacity: 0;
      z-index: 1;
    }

    #content-text-create-account {
      opacity: 1;
      z-index: 2;
    }

    .content-action-sign-in {
      opacity: 0;
      z-index: 1;
    }

    .content-action-create-account {
      opacity: 1;
      z-index: 2;
    }

    .separator {
      background: #777;

      span {
        color: #777;
      }
    }

    .create-account-btn {
      opacity: 0;
      z-index: 1;
    }

    .create-account-cancel-btn {
      opacity: 1;
      z-index: 2;
    }

    &.create-account-step-2, &.create-account-step-3 {
      #content-text-wrapper, .separator, #switch-default .btn-stack, .grant-info {
        transition-delay: 2s;
        opacity: 0.15;
        pointer-events: none;
      }

      .content-action-wrapper {
        animation: 2500ms create-account-warning;
        height: 25.8em;
        margin-bottom: -7.6em;
      }

      .content-action-create-account {
        overflow: hidden;
      }

      .create-account-ready-btn {
        opacity: 0;
        z-index: 1;
      }

      .create-account-ready {
        opacity: 1;
        z-index: 2;
      }
    }

    &.create-account-step-3, &.create-account-step-4 {
      #content-text-wrapper, .separator, #switch-default .btn-stack, .grant-info {
        transition-delay: 0s;
        opacity: 1;
      }

      .grant-info {
        pointer-events: auto;
      }

      #content-text-default {
        opacity: 0;
        z-index: 1;
      }

      #content-text-create-account {
        opacity: 0;
        z-index: 1;
      }

      #content-text-show-key {
        opacity: 1;
        z-index: 2;
      }

      #switch-default {
        opacity: 0;
        z-index: 1;
        pointer-events: none;
      }

      #switch-show-key {
        opacity: 1;
        z-index: 2;
      }
    }

    &.create-account-step-4 {
      #content-text-wrapper, .show-key-copy-btn, #switch-show-key .btn-stack, .grant-info {
        animation: 5000ms save-key-warning;
      }

      .show-key-wrapper .warning {
        height: 5.6em;
        margin: 3.2em 0;
        opacity: 1;
      }

      .show-key-continue-btn {
        z-index: 1;
        opacity: 0;
        transition-delay: 4500ms;
      }

      .show-key-login-btn {
        z-index: 2;
        opacity: 1;
        transition-delay: 4500ms;
      }
    }
  }

  @media screen and (max-width: 48rem) {
    .art {
      display: none;
    }

    .content {
      left: 0;
      width: 100%;
    }
  }

  @keyframes create-account-warning {
    0% {
      height: 6.2em;
      margin-bottom: 0;
    }

    20% {
      height: 9.6em;
    }

    80% {
      height: 9.6em;
      margin-bottom: 0;
    }

    100% {
      height: 25.8em;
      margin-bottom: -7.6em;
    }
  }

  @keyframes save-key-warning {
    0% {
      opacity: 1;
    }

    10% {
      opacity: 0.15;
    }

    90% {
      opacity: 0.15;
    }

    100% {
      opacity: 1;
    }
  }
</style>
