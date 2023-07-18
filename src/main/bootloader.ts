import { boot } from "./bootloader/kernel.js";
import exchangeCommunicationKeys from "./bootloader/messages/exchangeCommunicationKeys.js";
import setLoginKey from "./bootloader/messages/setLoginKey.js";

declare var browser: any; // tsc

document.title = "kernel.lume";
let header = document.createElement("h1");
header.textContent =
  "Something went wrong! You should not be visiting this page, this page should only be accessed via an invisible iframe.";
document.body.appendChild(header);

const kernelMessageHandlers = {
  exchangeCommunicationKeys,
  setLoginKey,
};

async function handleIncomingMessage(event: MessageEvent) {
  if (event.source === null) {
    return;
  }
  if (event.source === window) {
    return;
  }

  if (!("nonce" in event.data)) {
    (event.source as WindowProxy).postMessage(
      {
        nonce: "N/A",
        method: "response",
        err: "message sent to kernel with no nonce",
      },
      event.origin,
    );
    return;
  }

  if (!("method" in event.data)) {
    (event.source as WindowProxy).postMessage(
      {
        nonce: event.data.nonce,
        method: "response",
        err: "message sent to kernel with no method",
      },
      event.origin,
    );
    return;
  }

  if (event.data.method in kernelMessageHandlers) {
    let response;

    try {
      response = await kernelMessageHandlers[event.data.method](
        event.data.data,
      );
    } catch (e: any) {
      response = { err: (e as Error).message };
    }

    (event.source as WindowProxy).postMessage(
      {
        nonce: event.data.nonce,
        data: response,
      },
      event.origin,
    );
    return;
  }

  (event.source as WindowProxy).postMessage(
    {
      nonce: event.data.nonce,
      method: "response",
      err:
        "unrecognized method (user may need to log in): " + event.data.method,
    },
    event.origin,
  );
  return;
}

window.addEventListener("message", handleIncomingMessage);

boot();
