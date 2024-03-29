import {
  addQuery,
  deleteOpenPort,
  getAuthStatus,
  getAuthStatusDefer,
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
  if (!("nonce" in data)) {
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

  getAuthStatusDefer().promise.then(() => {
    port.postMessage({
      method: "kernelAuthStatus",
      data: getAuthStatus(),
    });
  });
}

export function broadcastToBridges(data: any) {
  for (const port of Object.entries(getOpenPorts())) {
    (port[1] as any).postMessage(data);
  }
}
