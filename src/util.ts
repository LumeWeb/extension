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

export const requestProxies = [
  { type: "http", host: "localhost", port: 25252 },
  { type: "http", host: "web3portal.com", port: 80 },
  { type: "http", host: "siasky.net", port: 80 },
  { type: "http", host: "skynetfree.net", port: 80 },
  { type: "http", host: "skynetpro.net", port: 80 },
];
