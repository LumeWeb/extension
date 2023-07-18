import {
  addQuery,
  deleteOpenPort,
  getAuthStatus,
  getBlockForBootloader,
  getBridgeLoadedResolve,
  getKernelIframe,
  getOpenPorts,
  getPortsNonce,
  increasePortsNonce,
  setOpenPort,
} from "../../vars.js";

function handleBridgeMessage(
  port: any,
  portNonce: number,
  data: any,
  domain: string,
) {
  if (data.method === "bridgeLoaded") {
    getBridgeLoadedResolve()();
    return;
  }

  if (!("nonce" in data)) {
    return;
  }

  if (data.method === "response") {
    window.postMessage(data);
    return;
  }

  if (data.method !== "queryUpdate") {
    addQuery(data.nonce, (response: any) => {
      if (portNonce in getOpenPorts()) {
        port.postMessage(response);
      }
    });
    data["domain"] = domain;
  }

  getKernelIframe().contentWindow!.postMessage(data, "http://kernel.lume");
}

export function bridgeListener(port: any) {
  let portNonce = getPortsNonce();
  increasePortsNonce();
  setOpenPort(portNonce, port);

  port.onDisconnect.addListener(() => {
    deleteOpenPort(portNonce);
  });

  let domain = new URL(port.sender.url).hostname;

  port.onMessage.addListener(function (data: any) {
    handleBridgeMessage(port, portNonce, data, domain);
  });

  getBlockForBootloader().then(() => {
    port.postMessage({
      method: "kernelAuthStatus",
      data: getAuthStatus(),
    });
  });
}
