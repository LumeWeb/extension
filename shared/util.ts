import browser from "webextension-polyfill";

import { createClient } from "@lumeweb/kernel-swarm-client";

let swarmClient = createClient();

export async function queryBackground(method: string, data = {}) {
  let resp;
  try {
    resp = await browser.runtime.sendMessage({
      method,
      data,
    });
  } catch (e) {
    throw e;
  }

  return resp;
}

export async function waitForBoot() {
  await queryBackground("waitForBoot");
}

export async function waitForConnected(cb?: Function) {
  await waitForBoot();
  await swarmClient.ready();
  await cb?.();
}

export async function listenBootStatus(cb: (percent: number) => void) {
  const port = browser.runtime.connect();

  port.onMessage.addListener((data: any) => {
    if (data?.method === "bootStatus") {
      cb(data.data);
    }
  });
}
