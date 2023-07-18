import tldEnum from "@lumeweb/tld-enum";
import { handleKernelMessage } from "./kernel.js";
import browser from "webextension-polyfill";
import { bridgeListener } from "./bridge.js";
import WebEngine from "../../webEngine.js";
import InternalProvider from "../../contentProviders/internalProvider.js";
import IpfsProvider from "../../contentProviders/ipfsProvider.js";
import ServerProvider from "../../contentProviders/serverProvider.js";
import { getKernelIframe, setKernelIframe, weAreBooted } from "../../vars.js";
import { init } from "@lumeweb/libkernel/kernel";

export async function boot() {
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

  weAreBooted();
}
