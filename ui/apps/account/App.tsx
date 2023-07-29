// @ts-ignore
import lumeLogo from "../../assets/lume-logo.png";
// @ts-ignore
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "ed25519-keygen/hdkey";
import { x25519 } from "@noble/curves/ed25519";
// @ts-ignore
import browser from "webextension-polyfill";
import { bytesToHex, hexToBytes, randomBytes } from "@lumeweb/libweb";
import { secretbox } from "@noble/ciphers/salsa";
import "./App.scss";
import {
  exchangeCommunicationKeys,
  setLoginKey,
} from "../../../shared/keys.js";

const BIP44_PATH = "m/44'/1627'/0'/0'/0'";

export default function App() {
  let [currentAction, setCurrentAction] = useState<
    "sign-in" | "create-account" | null
  >(null);
  let [createAccountStep, setCreateAccountStep] = useState<number>(0);
  let [generatedKey, setGeneratedKey] = useState<string[]>([]);
  let [copyKeySuccess, setCopyKeySuccess] = useState<boolean>(false);
  let [copyKeyError, setCopyKeyError] = useState<boolean>(false);

  let elSwitch = useRef<HTMLDivElement>();
  let elSwitchDefault = useRef<HTMLDivElement>();
  let elSwitchShowKey = useRef<HTMLDivElement>();
  let elContentTextActive = useRef<HTMLDivElement>();
  let elContentTextDefault = useRef<HTMLDivElement>();
  let elContentTextCreateAccount = useRef<HTMLDivElement>();
  let elContentTextWrapper = useRef<HTMLDivElement>();
  let elContentTextShowKey = useRef<HTMLDivElement>();
  let resizeTimeout = useRef<any>();
  let copyKeyTimeout = useRef<any>();
  let copyKeyCallback = useRef<any>();
  let elInputKey = useRef<HTMLInputElement>();

  function createAccount() {
    setCurrentAction("create-account");
    setCreateAccountStep(1);
  }

  function createAccountCancel() {
    setCurrentAction(null);
    setCreateAccountStep(0);
  }

  function signIn() {
    setCurrentAction("sign-in");
  }

  function inputKeySignIn() {
    if (!bip39.validateMnemonic(elInputKey.current.value, wordlist)) {
      alert("invalid key");
      return;
    }

    processSignIn(elInputKey.current.value);
  }

  function createAccountReady() {
    if (createAccountStep !== 1) {
      return;
    }

    setCreateAccountStep(2);
  }

  function showKey() {
    if (createAccountStep !== 2) {
      return;
    }

    // generate key
    setGeneratedKey(bip39.generateMnemonic(wordlist).split(" "));

    setCreateAccountStep(3);
    elSwitch.current.style.height = elSwitchDefault.current.offsetHeight + "px";
    elSwitchDefault.current.style.position = "absolute";

    setTimeout(() => {
      setContentTextHeight(elContentTextShowKey);
      elSwitch.current.style.height =
        elSwitchShowKey.current.offsetHeight + "px";

      elSwitch.current.addEventListener("transitionend", (event) => {
        if (event.target !== elSwitch.current) {
          return;
        }

        elSwitchShowKey.current.style.position = "static";
        elSwitch.current.style.height = "";
      });
    }, 0);
  }

  function createAccountBack() {
    setCreateAccountStep(1);
  }

  function showKeyWarning() {
    if (createAccountStep !== 3) {
      return;
    }

    setCreateAccountStep(4);
  }

  function generatedKeySignIn() {
    const seed = generatedKey.join(" ");

    if (!bip39.validateMnemonic(seed, wordlist)) {
      alert("invalid key");
      return;
    }

    processSignIn(seed);
  }

  const processSignIn = async (wordSeed) => {
    const seed = await bip39.mnemonicToSeed(wordSeed);
    const key = HDKey.fromMasterSeed(seed).derive(BIP44_PATH);

    await exchangeCommunicationKeys();
    await setLoginKey(key.privateKey);

    window.setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 1000);
  };

  function setContentTextHeight(element) {
    elContentTextActive.current = element;
    elContentTextWrapper.current.style.height = element.offsetHeight + "px";
  }

  function copyKey() {
    clearTimeout(copyKeyTimeout.current);

    navigator.clipboard
      .writeText(generatedKey.join(" "))
      .then(() => {
        copyKeyCallback.current?.();

        setCopyKeySuccess(true);

        copyKeyCallback.current = () => {
          copyKeyCallback.current = undefined;
          setCopyKeySuccess(null);
        };

        copyKeyTimeout.current = setTimeout(copyKeyCallback.current, 750);
      })
      .catch((error) => {
        console.error(error);

        copyKeyCallback.current?.();

        setCopyKeyError(true);

        copyKeyCallback.current = () => {
          copyKeyCallback.current = undefined;
          setCopyKeyError(false);
        };

        copyKeyTimeout.current = setTimeout(copyKeyCallback.current, 750);
      });
  }

  useEffect(() => {
    const onResize = () => {
      clearTimeout(resizeTimeout.current);

      resizeTimeout.current = setTimeout(() => {
        setContentTextHeight(elContentTextActive);
      }, 25);
    };

    window.addEventListener("resize", onResize);
  });

  return (
    <>
      <header>
        <img src={lumeLogo} alt="Lume" />
      </header>
      <main
        className={classNames({
          "sign-in": currentAction === "sign-in",
          "create-account": currentAction === "create-account",
          "create-account-step-2": createAccountStep === 2,
          "create-account-step-3": createAccountStep === 3,
          "create-account-step-4": createAccountStep === 4,
        })}>
        <div className="art">
          <div className="gradient-1" />
          <div className="gradient-2" />
          <div className="gradient-3" />
        </div>
        <div className="content">
          <div>
            <div>
              <div id="content-text-wrapper" ref={elContentTextWrapper}>
                <div id="content-text-default" ref={elContentTextDefault}>
                  <h1>Access the open web with ease</h1>
                  <p>
                    Seamless access to the open web with Lume, integrated
                    Handshake (HNS) and Ethereum (ENS) Support.
                  </p>
                </div>
                <div
                  id="content-text-create-account"
                  ref={elContentTextCreateAccount}>
                  <h1>Set up your account key</h1>
                  <p>
                    Let’s create your account key or seed phrase. This phrase
                    will be used to access your Lume account. Make sure to keep
                    it safe at all times.
                  </p>
                </div>
                <div id="content-text-show-key" ref={elContentTextShowKey}>
                  <h1>Here’s your account key</h1>
                  <p>Make sure to keep it safe at all times.</p>
                </div>
              </div>
              <div id="switch" ref={elSwitch}>
                <div id="switch-default" ref={elSwitchDefault}>
                  <div className="content-action-wrapper">
                    <div className="content-action-sign-in">
                      <div className="content-action-inner">
                        <div className="btn-wrapper sign-in-btn">
                          <button
                            className="btn-main btn-black"
                            onClick={signIn}>
                            Sign in with Account Key
                          </button>
                        </div>
                        <div className="sign-in-form">
                          <div className="input-wrapper">
                            <input
                              type="text"
                              placeholder="Insert your 12-word account key here"
                              ref={elInputKey}
                            />
                          </div>
                          <div className="btn-wrapper">
                            <button
                              className="btn-main btn-green"
                              onClick={inputKeySignIn}>
                              Login
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="content-action-create-account">
                      <div className="content-action-inner">
                        <div className="btn-wrapper create-account-ready-btn">
                          <button
                            className="btn-main btn-green"
                            onClick={createAccountReady}>
                            I get it, I’ll keep it safe. Let’s see the key.
                          </button>
                        </div>
                        <div className="create-account-ready">
                          <div className="warning">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke-width="1.5"
                              stroke="currentColor">
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                              />
                            </svg>
                            <div>
                              Should you lose this key, you will be forced to
                              create a new account.
                            </div>
                          </div>
                          <div className="btn-wrapper create-account-show-key-btn">
                            <button className="btn-main" onClick={showKey}>
                              I’m ready, show me the key
                            </button>
                          </div>
                          <div className="btn-wrapper create-account-back-btn">
                            <button onClick={createAccountBack}>
                              <span>Go back</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="separator">
                    <span>OR</span>
                  </div>
                  <div className="btn-stack">
                    <div className="btn-wrapper create-account-btn">
                      <button
                        className="btn-main btn-green"
                        onClick={createAccount}>
                        Create an Account
                      </button>
                    </div>
                    <div className="btn-wrapper create-account-gray-btn">
                      <button
                        className="btn-main btn-black gray-text"
                        onClick={createAccount}>
                        Create an Account
                      </button>
                    </div>
                    <div className="btn-wrapper create-account-cancel-btn">
                      <button
                        className="btn-main btn-black gray-text"
                        onClick={createAccountCancel}>
                        Go back
                      </button>
                    </div>
                  </div>
                </div>
                <div id="switch-show-key" ref={elSwitchShowKey}>
                  {createAccountStep > 2 && (
                    <div className="show-key-wrapper">
                      <div className="show-key-grid">
                        {generatedKey.map((word, index) => (
                          <div>
                            <span>{index + 1}</span>
                            {word}
                          </div>
                        ))}
                      </div>
                      <div className="warning">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                          />
                        </svg>
                        <div>
                          Make sure to write this key down for safe keeping.
                        </div>
                      </div>
                      <div className="btn-wrapper show-key-copy-btn">
                        <button
                          className={classNames("btn-main btn-black", {
                            success: copyKeySuccess,
                            error: copyKeyError,
                          })}
                          onClick={copyKey}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                            />
                          </svg>
                          {!copyKeySuccess &&
                            !copyKeyError &&
                            "Copy Account Key"}
                          {copyKeySuccess &&
                            !copyKeyError &&
                            "Account Key Copied"}
                          {!copyKeySuccess &&
                            copyKeyError &&
                            "Account Key Copy Failed"}
                        </button>
                      </div>
                      <div className="btn-stack">
                        <div className="btn-wrapper show-key-continue-btn">
                          <button className="btn-main" onClick={showKeyWarning}>
                            Continue
                          </button>
                        </div>
                        <div className="btn-wrapper show-key-login-btn">
                          <button
                            className="btn-main btn-green"
                            onClick={generatedKeySignIn}>
                            Login
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
