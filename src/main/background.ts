import type { DataFn, KernelAuthStatus } from "libskynet";
import tldEnum from "@lumeweb/tld-enum";
import WebEngine from "../webEngine.js";
import InternalProvider from "../contentProviders/internalProvider.js";
import SkynetProvider from "../contentProviders/skynetProvider.js";
import ServerProvider from "../contentProviders/serverProvider.js";
import { init } from "libkernel";
import IpfsProvider from "../contentProviders/ipfsProvider.js";
import { ready as dnsReady } from "@lumeweb/kernel-dns-client";

declare var browser: any; // tsc
let queriesNonce = 1;
let queries: any = {};
let portsNonce = 0;
let openPorts = {} as any;
let timer = 20000;

function logLargeObjects() {
  let queriesLen = Object.keys(queries).length;
  let portsLen = Object.keys(openPorts).length;
  if (queriesLen > 500) {
    console.error("queries appears to be leaking:", queriesLen);
  }
  if (portsLen > 50) {
    console.error("ports appears to be leaking:", portsLen);
  }
  timer *= 1.25;
  setTimeout(logLargeObjects, timer);
}
setTimeout(logLargeObjects, timer);

export let authStatus: KernelAuthStatus;
let authStatusKnown = false;
let authStatusResolve: DataFn;
let bridgeLoadedResolve: DataFn;
let blockForBootloader = new Promise((resolve) => {
  authStatusResolve = resolve;
});
let blockForBridge = new Promise((resolve) => {
  bridgeLoadedResolve = resolve;
});
let kernelFrame: HTMLIFrameElement;

export function queryKernel(query: any): Promise<any> {
  return new Promise((resolve) => {
    let receiveResponse = function (data: any) {
      resolve(data.data);
    };

    blockForBootloader.then(() => {
      let nonce = queriesNonce;
      queriesNonce += 1;
      query.nonce = nonce;
      queries[nonce] = receiveResponse;
      if (kernelFrame.contentWindow !== null) {
        kernelFrame.contentWindow.postMessage(query, "http://kernel.skynet");
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
    blockForBridge.then(() => {
      for (let [, port] of Object.entries(openPorts)) {
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
    authStatus = data;
    if (authStatusKnown === false) {
      authStatusResolve();
      authStatusKnown = true;
      console.log("bootloader is now initialized");
      if (authStatus.loginComplete !== true) {
        console.log("user is not logged in: waiting until login is confirmed");
      }
    }

    for (let [, port] of Object.entries(openPorts)) {
      try {
        (port as any).postMessage(event.data);
      } catch {}
    }

    if (data.logoutComplete === true) {
      console.log("received logout signal, clearing all ports");

      for (let [, port] of Object.entries(openPorts)) {
        try {
          (port as any).disconnect();
        } catch {}
      }
      openPorts = {};
    }

    return;
  }

  if (!(event.data.nonce in queries)) {
    return;
  }

  let receiveResult = queries[event.data.nonce];
  if (event.data.method === "response") {
    delete queries[event.data.nonce];
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
    bridgeLoadedResolve();
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
    queries[data.nonce] = (response: any) => {
      if (portNonce in openPorts) {
        port.postMessage(response);
      }
    };
    data["domain"] = domain;
  }
  kernelFrame.contentWindow!.postMessage(data, "http://kernel.skynet");
}
function bridgeListener(port: any) {
  let portNonce = portsNonce;
  portsNonce++;
  openPorts[portNonce] = port;

  port.onDisconnect.addListener(() => {
    delete openPorts[portNonce];
  });

  let domain = new URL(port.sender.url).hostname;

  port.onMessage.addListener(function (data: any) {
    handleBridgeMessage(port, portNonce, data, domain);
  });

  blockForBootloader.then(() => {
    port.postMessage({
      method: "kernelAuthStatus",
      data: authStatus,
    });
  });
}

async function boot() {
  tldEnum.list.push("localhost");
  window.addEventListener("message", handleKernelMessage);
  browser.runtime.onConnect.addListener(bridgeListener);

  const engine = new WebEngine();
  engine.registerContentProvider(new InternalProvider(engine));
  engine.registerContentProvider(new ServerProvider(engine));
  engine.registerContentProvider(new SkynetProvider(engine));
  engine.registerContentProvider(new IpfsProvider(engine));

  // @ts-ignore
  kernelFrame = document.createElement("iframe");
  kernelFrame.src = "http://kernel.skynet";
  kernelFrame.onload = init;
  document.body.appendChild(kernelFrame);

  await dnsReady();
}

boot();
