import {
  addContextToErr,
  b64ToBuf,
  defaultPortalList,
  Err,
  objAsString,
  progressiveFetch,
  progressiveFetchResult,
  validSkylink,
  verifyDownloadResponse,
} from "libskynet";
import { DHT } from "@lumeweb/kernel-dht-client";

defaultPortalList.unshift("https://web3portal.com");
defaultPortalList.pop();

const relayDht = new DHT();

export function isIp(ip: string) {
  return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    ip
  );
}

export function isDomain(domain: string) {
  return /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/.test(
    domain
  );
}

export function normalizeDomain(domain: string): string {
  return domain.replace(/^\.+|\.+$/g, "").replace(/^\/+|\/+$/g, "");
}

export async function getRelayProxies() {
  let relays: string[] = await relayDht.getRelayServers();
  let proxies = [{ type: "http", host: "localhost", port: 25252 }];

  for (const relay of relays) {
    proxies.push({ type: "http", host: new URL(relay).hostname, port: 25252 });
  }

  return proxies;
}

export const requestProxies = [
  { type: "http", host: "localhost", port: 25252 },
  { type: "http", host: "web3portal.com", port: 80 },
  { type: "http", host: "siasky.net", port: 80 },
  { type: "http", host: "skynetfree.net", port: 80 },
  { type: "http", host: "skynetpro.net", port: 80 },
];

export function getTld(hostname: string): string {
  return hostname.includes(".")
    ? hostname.split(".")[hostname.split(".").length - 1]
    : hostname;
}

export type FileDataType = {
  err: null;
  response: Response | null;
  fileData: Uint8Array;
};

export function downloadSkylink(
  skylink: string,
  path?: string
): Promise<[data: FileDataType, err: Err]> {
  return new Promise((resolve) => {
    // Get the Uint8Array of the input skylink.
    let [u8Link, errBTB] = b64ToBuf(skylink);
    if (errBTB !== null) {
      resolve([{} as any, addContextToErr(errBTB, "unable to decode skylink")]);
      return;
    }
    if (!validSkylink(u8Link)) {
      resolve([{} as any, "skylink appears to be invalid"]);
      return;
    }

    // Prepare the download call.
    let endpoint = "/" + skylink;
    if (path) {
      endpoint += path;
    }
    let fileDataPtr: FileDataType = {
      fileData: new Uint8Array(0),
      err: null,
      response: null,
    };
    let verifyFunction = function (response: Response): Promise<Err> {
      return verifyDownloadResponse(response, u8Link, fileDataPtr);
    };

    // Perform the download call.
    progressiveFetch(endpoint, null, defaultPortalList, () =>
      Promise.resolve(null)
    ).then((result: progressiveFetchResult) => {
      // Return an error if the call failed.
      if (result.success !== true) {
        // Check for a 404.
        for (let i = 0; i < result.responsesFailed.length; i++) {
          if (result.responsesFailed[i].status === 404) {
            resolve([{} as any, "404"]);
            return;
          }
        }

        // Error is not a 404, return the logs as the error.
        let err = objAsString(result.logs);
        resolve([
          {} as any,
          addContextToErr(err, "unable to complete download"),
        ]);
        return;
      }
      // Check if the portal is honest but the download is corrupt.
      if (fileDataPtr.err !== null) {
        resolve([
          {} as any,
          addContextToErr(fileDataPtr.err, "download is corrupt"),
        ]);
        return;
      }

      fileDataPtr.response = result.response;
      resolve([fileDataPtr, null]);
    });
  });
}

export async function* iterateStream(
  stream: ReadableStream<any>
): AsyncGenerator<Uint8Array> {
  let chunk;
  const reader = stream.getReader();
  do {
    chunk = await reader.read();
    if (chunk.value) {
      yield chunk.value;
    }
  } while (!chunk.done);

  reader.releaseLock();
}

export async function streamToArray(
  stream: ReadableStream<Uint8Array>
): Promise<Uint8Array> {
  let buffer = new Uint8Array();

  for await (const chunk of iterateStream(stream)) {
    buffer = Uint8Array.from([...buffer, ...chunk]);
  }

  return buffer;
}
