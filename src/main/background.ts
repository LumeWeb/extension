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

browser.runtime.onMessage.addListener(async (request, sender) => {
  if (sender.id !== browser.runtime.id) {
    return Promise.reject("access denied");
  }

  if (!("method" in request)) {
    return Promise.reject("method required");
  }
  if (!("data" in request)) {
    return Promise.reject("data required");
  }

  const ret = await queryKernel({
    method: request.method,
    data: request.data,
  });

  if (ret?.err) {
    throw new Error(ret.err);
  }

  return ret;
});

boot();
