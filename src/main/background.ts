import tldEnum from "@lumeweb/tld-enum";
import WebEngine from "../webEngine.js";
import InternalProvider from "../contentProviders/internalProvider.js";
import ServerProvider from "../contentProviders/serverProvider.js";
import { init, kernelLoaded } from "libkernel";
import IpfsProvider from "../contentProviders/ipfsProvider.js";
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
  getDnsSetupPromise,
  getDnsSetupDefer,
} from "./vars.js";
// @ts-ignore
import browser from "@lumeweb/webextension-polyfill";
import setupContextMenus from "../contextMenu.js";
import { callModule } from "libkernel";
import {
  dnsClient,
  ipfsClient,
  peerDiscoveryClient,
  swarmClient,
} from "../clients.js";

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
          "http://kernel.lume"
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

  if (event.origin !== "http://kernel.lume") {
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

  getKernelIframe().contentWindow!.postMessage(data, "http://kernel.lume");
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

  engine.registerContentProvider(new IpfsProvider(engine));
  engine.registerContentProvider(new ServerProvider(engine));

  setKernelIframe(document.createElement("iframe"));
  getKernelIframe().src = "http://kernel.lume";

  await new Promise((resolve) => {
    getKernelIframe().onload = () => {
      init().then(resolve);
    };
    document.body.appendChild(getKernelIframe());
  });

  await kernelLoaded();
  await swarmClient.addRelay(
    "fd35779a2dcae738308098e8f6702e25c282a52cce972ff2f96bcc50d5043c99"
  );
  await peerDiscoveryClient.register(
    "_AEPtjxDCq3H4nmLLV7-P0L3D_d_Aude4i9O9S498dXcFw"
  );
  await ipfsClient.ready();
  setupContextMenus(engine);

  dnsSetup();

  await getDnsSetupDefer().promise;

  console.log("ready");
}

async function dnsSetup() {
  const resolvers = [
    "_B0tpRWWzAf77qfhiRMx1EGTDURht_2V9VsUmMqIzcpW4Q", // ens
    // "vAMl33T1TusZqZmJl9mlWJCbYm_Lu1TPjE3aSl2ZFHE_yg", // hns
  ];

  for (const resolver of resolvers) {
    await dnsClient.registerResolver(resolver);
  }

  getDnsSetupDefer().resolve();
}
boot();
