import { getTimer } from "../vars.js";
import browser from "webextension-polyfill";
import { logLargeObjects } from "./background/util.js";
import { queryKernel } from "./background/kernel.js";
import { boot } from "./background/boot.js";

setTimeout(logLargeObjects, getTimer());

browser.runtime.onInstalled.addListener(() => {
  browser.tabs.create({
    url: browser.runtime.getURL("onboarding.html"),
    active: true,
  });
});

boot();
