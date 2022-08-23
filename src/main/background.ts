import tldEnum from "@lumeweb/tld-enum";
import WebEngine from "../webEngine.js";
import InternalProvider from "../contentProviders/internalProvider.js";
import SkynetProvider from "../contentProviders/skynetProvider.js";
import ServerProvider from "../contentProviders/serverProvider.js";
import { init } from "libkernel";
import IpfsProvider from "../contentProviders/ipfsProvider.js";
import { ready as dnsReady } from "@lumeweb/kernel-dns-client";
import {
  addQuery,
  getAuthStatusResolve,
  getBlockForBootloader,
  getBlockForBridge,
  getBridgeLoadedResolve,
  clearOpenPorts,
  deleteOpenPort,
  deleteQuery,
  getAuthStatus,
  getAuthStatusKnown,
  getKernelIframe,
  getOpenPorts,
  getPortsNonce,
  getQueries,
  getQueriesNonce,
  getQuery,
  getTimer,
  increasePortsNonce,
  increaseQueriesNonce,
  setAuthStatus,
  setAuthStatusKnown,
  setDnsSetupPromise,
  setKernelIframe,
  setOpenPort,
  setTimer,
} from "./vars.js";
import browser from "@lumeweb/webextension-polyfill";
import setupContextMenus from "../contextMenu.js";
import { callModule } from "libkernel";

function logLargeObjects() {
  let queriesLen = Object.keys(getQueries()).length;
  let portsLen = Object.keys(getOpenPorts()).length;
  if (queriesLen > 500) {
    console.error("queries appears to be leaking:", queriesLen);
  }
  if (portsLen > 50) {
    console.error("ports appears to be leaking:", portsLen);
  }
  setTimer(getTimer() * 1.25);
  setTimeout(logLargeObjects, getTimer());
}
setTimeout(logLargeObjects, getTimer());

export function queryKernel(query: any): Promise<any> {
  return new Promise((resolve) => {
    let receiveResponse = function (data: any) {
      resolve(data.data);
    };

    getBlockForBootloader().then(() => {
      let nonce = getQueriesNonce();
      increaseQueriesNonce();
      query.nonce = nonce;
      addQuery(nonce, receiveResponse);
      if (getKernelIframe().contentWindow !== null) {
        (getKernelIframe() as any).contentWindow.postMessage(
          query,
          "http://kernel.skynet"
        );
      } else {
        console.error(
          "kernelFrame.contentWindow was null, cannot send message!"
        );
      }
    });
  });
}
function handleKernelMessage(event: MessageEvent) {
  let data = event.data.data;

  if (event.data.method === "kernelBridgeVersion") {
    getBlockForBridge().then(() => {
      for (let [, port] of Object.entries(getOpenPorts())) {
        try {
          (port as any).postMessage(event.data);
        } catch {}
      }
    });

    return;
  }

  if (event.origin !== "http://kernel.skynet") {
    return;
  }

  if (event.data.method === "log") {
    if (data.isErr === false) {
      console.log(data.message);
    } else {
      console.error(data.message);
    }
    return;
  }

  if (event.data.method === "kernelAuthStatus") {
    setAuthStatus(data);
    if (getAuthStatusKnown() === false) {
      getAuthStatusResolve()();
      setAuthStatusKnown(true);
      console.log("bootloader is now initialized");
      if (getAuthStatus().loginComplete !== true) {
        console.log("user is not logged in: waiting until login is confirmed");
      }
    }

    for (let [, port] of Object.entries(getOpenPorts())) {
      try {
        (port as any).postMessage(event.data);
      } catch {}
    }

    if (data.logoutComplete === true) {
      console.log("received logout signal, clearing all ports");

      for (let [, port] of Object.entries(getOpenPorts())) {
        try {
          (port as any).disconnect();
        } catch {}
      }
      clearOpenPorts();
    }

    return;
  }

  if (!(event.data.nonce in getQueries())) {
    return;
  }

  let receiveResult = getQuery(event.data.nonce);
  if (event.data.method === "response") {
    deleteQuery(event.data.nonce);
  }

  receiveResult(event.data);
}

function handleBridgeMessage(
  port: any,
  portNonce: number,
  data: any,
  domain: string
) {
  if (data.method === "bridgeLoaded") {
    getBridgeLoadedResolve()();
    return;
  }

  if (!("nonce" in data)) {
    return;
  }

  if (data.method === "response") {
    window.postMessage(data);
    return;
  }

  if (data.method !== "queryUpdate") {
    addQuery(data.nonce, (response: any) => {
      if (portNonce in getOpenPorts()) {
        port.postMessage(response);
      }
    });
    data["domain"] = domain;
  }
  getKernelIframe().contentWindow!.postMessage(data, "http://kernel.skynet");
}
function bridgeListener(port: any) {
  let portNonce = getPortsNonce();
  increasePortsNonce();
  setOpenPort(portNonce, port);

  port.onDisconnect.addListener(() => {
    deleteOpenPort(portNonce);
  });

  let domain = new URL(port.sender.url).hostname;

  port.onMessage.addListener(function (data: any) {
    handleBridgeMessage(port, portNonce, data, domain);
  });

  getBlockForBootloader().then(() => {
    port.postMessage({
      method: "kernelAuthStatus",
      data: getAuthStatus(),
    });
  });
}

async function boot() {
  tldEnum.list.push("localhost");
  window.addEventListener("message", handleKernelMessage);
  browser.runtime.onConnect.addListener(bridgeListener);

  const engine = new WebEngine();
  engine.registerContentProvider(new InternalProvider(engine));
  engine.registerContentProvider(new SkynetProvider(engine));
  engine.registerContentProvider(new IpfsProvider(engine));
  engine.registerContentProvider(new ServerProvider(engine));

  setKernelIframe(document.createElement("iframe"));
  getKernelIframe().src = "http://kernel.skynet";
  getKernelIframe().onload = init;
  document.body.appendChild(getKernelIframe());

  setupContextMenus(engine);
  setDnsSetupPromise(dnsSetup());
}

async function dnsSetup() {
  const resolvers = [
    "AQBXtVkPDbZ5Qmjl8dzJ0siSYaFcS3XbDZHapxmZCLfwfg", // icann
    "AQAI3TbarrXRxWtrb_5XO-gMYg-UsjVAChue5JEoqywbAw", // eip137
    "AQD0s0wZNpZCVg_iO96E6Ff66WxGa2CZst_DCYR_DoQPxw", // solana
    "AQDtYcJGbquAHA-idtZ-gPOlNBgEVeCZtZUtsyL_J5ZiUA", // algorand
    "AQDkqoCzCR6s5MP_k6Ee9QWfEwaH5-7XleCKFL1CdxExxQ", // avax
    "AQC7ALr-OtkFT7qZby2BdMMNbTRXHNMGlpV6r96b35Z79Q", // evmos
    "AQAmQoZLu1DqIiZaRWRpomvMarQ8Uc3kdHJQBo0r-9uYtg", // handshake
  ];

  for (const resolver of resolvers) {
    await callModule(resolver, "register");
  }

  await dnsReady();
}

boot();
