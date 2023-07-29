import tldEnum from "@lumeweb/tld-enum";
import { handleKernelMessage } from "./kernel.js";
import browser from "webextension-polyfill";
import { bridgeListener } from "./bridge.js";
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

  await swarmClient.addRelay(
    "2d7ae1517caf4aae4de73c6d6f400765d2dd00b69d65277a29151437ef1c7d1d",
  );
  // IRC
  await peerDiscoveryClient.register(
    "zduL5de7GC5DVpf92FkShUZZrTpUi6hki2BaTaVwjs9cnmCmKWNywBWyHR",
  );

  await networkRegistryClient.registerType("content");
  await networkRegistryClient.registerType("blockchain");
  await handshakeClient.register();
  await ethClient.register();
  await ipfsClient.register();

  const resolvers = [
    "zduTVXTv1Ga1eEDaSMS2HGDfoaG5ALtnPb6coHESyB1qehk49sBzB5qsb5", // ENS
    "zduLJpshCdKW2juHBzvog62DxWwcaY6WLg7npDevzt6WpQyMrS18o34xF1", // HNS
  ];

  for (const resolver of resolvers) {
    await dnsClient.registerResolver(resolver);
  }

  weAreBooted();
}
