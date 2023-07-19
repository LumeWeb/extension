import {
  addQuery,
  clearOpenPorts,
  deleteQuery,
  getAuthStatus,
  getAuthStatusDefer,
  getAuthStatusKnown,
  getKernelIframe,
  getLoggedInDefer,
  getOpenPorts,
  getQueries,
  getQueriesNonce,
  getQuery,
  increaseQueriesNonce,
  resetLoggedInDefer,
  setAuthStatus,
  setAuthStatusKnown,
} from "../../vars.js";

export function handleKernelMessage(event: MessageEvent) {
  let data = event.data.data;

  if (event.data.method === "kernelBridgeVersion") {
    for (let [, port] of Object.entries(getOpenPorts())) {
      try {
        (port as any).postMessage(event.data);
      } catch {}
    }

    return;
  }

  if (event.origin !== "http://kernel.lume") {
    return;
  }

  if (event.data.method === "log") {
    if (data.isErr !== null && !data.isErr) {
      console.log(data.message);
    } else {
      console.error(data.message);
    }
    return;
  }

  if (event.data.method === "kernelAuthStatus") {
    setAuthStatus(data);
    if (!getAuthStatusKnown()) {
      getAuthStatusDefer().resolve();
      setAuthStatusKnown(true);
      console.log("bootloader is now initialized");
      if (!getAuthStatus().loginComplete) {
        console.log("user is not logged in: waiting until login is confirmed");
      } else {
        getLoggedInDefer().resolve();
      }
      if (getAuthStatus().logoutComplete) {
        resetLoggedInDefer();
        setAuthStatusKnown(false);
      }
    }

    for (let [, port] of Object.entries(getOpenPorts())) {
      try {
        (port as any).postMessage(event.data);
      } catch {}
    }

    if (data.logoutComplete === true) {
      console.log("received logout signal, clearing all ports");

      for (let [, port] of Object.entries(getOpenPorts())) {
        try {
          (port as any).disconnect();
        } catch {}
      }
      clearOpenPorts();
    }

    return;
  }

  if (!(event.data.nonce in getQueries())) {
    return;
  }

  let receiveResult = getQuery(event.data.nonce);
  if (event.data.method === "response") {
    deleteQuery(event.data.nonce);
  }

  receiveResult(event.data);
}

export function queryKernel(query: any): Promise<any> {
  return new Promise((resolve) => {
    let receiveResponse = function (data: any) {
      resolve(data.data);
    };

    getAuthStatusDefer().promise.then(() => {
      let nonce = getQueriesNonce();
      increaseQueriesNonce();
      query.nonce = nonce;
      addQuery(nonce, receiveResponse);
      if (getKernelIframe().contentWindow !== null) {
        (getKernelIframe() as any).contentWindow.postMessage(
          query,
          "http://kernel.lume",
        );
      } else {
        console.error(
          "kernelFrame.contentWindow was null, cannot send message!",
        );
      }
    });
  });
}
