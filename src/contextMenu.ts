import browser from "@lumeweb/webextension-polyfill";
import type WebEngine from "./webEngine.js";
import type { Menus, Tabs } from "./types.js";
import IpfsProvider from "./contentProviders/ipfsProvider.js";
import { cacheDb } from "./databases.js";

export default function setup(engine: WebEngine) {
  browser.menus.create({
    title: "Clear Cache",
    id: "clear-cache",
    onclick: async (info: Menus.OnClickData, tab: Tabs.Tab) => {
      // @ts-ignore
      await cacheDb.items
        .where("url")
        .startsWithIgnoreCase(
          `http://${new URL(info.pageUrl as string).hostname}`
        )
        .delete();
      browser.tabs.reload(tab.id);
    },
  });

  browser.menus.onShown.addListener((details: Menus.OnShownInfoType) => {
    const provider = engine.getDomainContentProvider(
      new URL(details.pageUrl as string).hostname
    );
    browser.menus.update("clear-cache", {
      visible: provider instanceof IpfsProvider,
    });
  });
}
