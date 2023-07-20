import exchangeCommunicationKeys from "./messages/exchangeCommunicationKeys.js";
import setLoginKey from "./messages/setLoginKey.js";

const kernelMessageHandlers = {
  exchangeCommunicationKeys,
  setLoginKey,
};

export async function handleIncomingMessage(event: MessageEvent) {
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

  if (["moduleCall", "response"].includes(event.data.method)) {
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
