import tldEnum from "@lumeweb/tld-enum";
import { handleKernelMessage } from "./kernel.js";
import browser from "webextension-polyfill";
import { bridgeListener, broadcastToBridges } from "./bridge.js";
import WebEngine from "../../webEngine.js";
import InternalProvider from "../../contentProviders/internalProvider.js";
import IpfsProvider from "../../contentProviders/ipfsProvider.js";
import ServerProvider from "../../contentProviders/serverProvider.js";
import {
  events,
  getKernelIframe,
  resetBooted,
  setKernelIframe,
  weAreBooted,
} from "../../vars.js";
import { init } from "@lumeweb/libkernel/kernel";
import {
  dnsClient,
  ethClient,
  handshakeClient,
  ipfsClient,
  networkRegistryClient,
  peerDiscoveryClient,
  swarmClient,
} from "../../clients.js";
import type { KernelAuthStatus } from "@lumeweb/libweb";

let engine: WebEngine;

const BOOT_FUNCTIONS: (() => Promise<any>)[] = [];

export async function boot() {
  tldEnum.list.push("localhost");
  window.addEventListener("message", handleKernelMessage);
  browser.runtime.onConnect.addListener(bridgeListener);

  engine = new WebEngine();
  engine.registerContentProvider(new InternalProvider(engine));

  setKernelIframe(document.createElement("iframe"));
  getKernelIframe().src = "http://kernel.lume";

  getKernelIframe().onload = init;
  document.body.appendChild(getKernelIframe());
  events.on("authStatus", async (changes: KernelAuthStatus) => {
    if (changes.loginComplete) {
      await doInit();
    }
    if (changes.logoutComplete) {
      resetBooted();
    }
  });
}

export async function doInit() {
  engine.registerContentProvider(new IpfsProvider(engine));
  engine.registerContentProvider(new ServerProvider(engine));

  BOOT_FUNCTIONS.push(
    async () =>
      await swarmClient.addRelay(
        "2d7ae1517caf4aae4de73c6d6f400765d2dd00b69d65277a29151437ef1c7d1d",
      ),
  );

  // IRC
  BOOT_FUNCTIONS.push(
    async () =>
      await peerDiscoveryClient.register(
        "zduL5de7GC5DVpf92FkShUZZrTpUi6hki2BaTaVwjs9cnmCmKWNywBWyHR",
      ),
  );
  BOOT_FUNCTIONS.push(
    async () => await networkRegistryClient.registerType("content"),
  );
  BOOT_FUNCTIONS.push(
    async () => await networkRegistryClient.registerType("blockchain"),
  );
  BOOT_FUNCTIONS.push(async () => await handshakeClient.register());
  BOOT_FUNCTIONS.push(async () => await ethClient.register());
  BOOT_FUNCTIONS.push(async () => await ipfsClient.register());

  const resolvers = [
    "zduRfyhiAu871qg14RUapxxsBS4gaFxnWXs1jxf3guk2vVAhSx6vJp1kxo", // CID
    "zduPorYNSjbkTipeAtDcW8bfRw4qhEb6rbf6yrMdGcxTthkmNkHfJGyyi7", // ENS
    "zduSaggqnrSZ1wp6ZEbnNzR4jZvexxNJjoxbNTHNKbQxKfyJNzhAzbhYns", // HNS
  ];

  for (const resolver of resolvers) {
    BOOT_FUNCTIONS.push(async () => dnsClient.registerResolver(resolver));
  }

  await bootup();

  weAreBooted();
}

async function bootup() {
  for (const entry of Object.entries(BOOT_FUNCTIONS)) {
    await entry[1]();
    const decPercent = (parseInt(entry[0]) + 1) / BOOT_FUNCTIONS.length;
    broadcastBootStatus(decPercent * 100);
  }
}

function broadcastBootStatus(percent: number) {
  broadcastToBridges({
    method: "bootStatus",
    data: percent,
  });
}
