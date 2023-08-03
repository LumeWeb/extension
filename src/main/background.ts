import { awaitBooted, events, getTimer } from "../vars.js";
import browser from "webextension-polyfill";
import { logLargeObjects } from "./background/util.js";
import { queryKernel } from "./background/kernel.js";
import { boot } from "./background/boot.js";
import * as kernel from "@lumeweb/libkernel";
import type { KernelAuthStatus } from "@lumeweb/libweb";
import defer from "p-defer";

setTimeout(logLargeObjects, getTimer());

browser.runtime.onInstalled.addListener(async () => {
  let loggedIn = false;

  events.on("authStatus", (update: KernelAuthStatus) => {
    if (update.loginComplete) {
      loggedIn = true;
    }
  });

  const timerDefer = defer();
  setTimeout(timerDefer.resolve, 1000);

  await timerDefer.promise;

  if (!loggedIn) {
    browser.tabs.create({
      url: browser.runtime.getURL("onboarding.html"),
      active: true,
    });
  }
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

  if (request.method === "waitForBoot") {
    await awaitBooted();
    return true;
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

globalThis.kernel = kernel;
