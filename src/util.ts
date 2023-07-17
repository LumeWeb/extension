export function isIp(ip: string) {
  return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    ip,
  );
}

export function isDomain(domain: string) {
  return /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/.test(
    domain,
  );
}

export function normalizeDomain(domain: string): string {
  return domain.replace(/^\.+|\.+$/g, "").replace(/^\/+|\/+$/g, "");
}

export async function getRelayProxies() {
  //let relays: string[] = await relayDht.getRelayServers();
  let proxies = [
    { type: "http", host: "localhost", port: 25252 },
    { type: "http", host: "web3portal.com", port: 80 },
  ];
  /*
  for (const relay of relays) {
    proxies.push({ type: "http", host: new URL(relay).hostname, port: 25252 });
  }*/

  return proxies;
}

export const requestProxies = [
  { type: "http", host: "localhost", port: 25252 },
  { type: "http", host: "web3portal.com", port: 80 },
];

export function getTld(hostname: string): string {
  return hostname.includes(".")
    ? hostname.split(".")[hostname.split(".").length - 1]
    : hostname;
}
export async function* iterateStream(
  stream: ReadableStream<any>,
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
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  let buffer = new Uint8Array();

  for await (const chunk of iterateStream(stream)) {
    buffer = Uint8Array.from([...buffer, ...chunk]);
  }

  return buffer;
}
