import type { DataFn, KernelAuthStatus } from "libskynet";

export let queriesNonce = 1;
export let queries: any = {};
export let portsNonce = 0;
export let openPorts = {} as any;
export let timer = 20000;

let authStatus: KernelAuthStatus;
let authStatusKnown = false;
export let authStatusResolve: DataFn;
export let bridgeLoadedResolve: DataFn;
export let blockForBootloader = new Promise((resolve) => {
  authStatusResolve = resolve;
});
export let blockForBridge = new Promise((resolve) => {
  bridgeLoadedResolve = resolve;
});
export let kernelFrame: HTMLIFrameElement;

export function getAuthStatusKnown() {
  return authStatusKnown;
}
export function setAuthStatusKnown(status: boolean) {
  authStatusKnown = status;
}

export function getAuthStatus(): KernelAuthStatus {
  return authStatus;
}

export function setAuthStatus(status: KernelAuthStatus) {
  authStatus = status;
}

export function getQueriesNonce(): number {
  return queriesNonce;
}

export function increaseQueriesNonce() {
  queriesNonce++;
}

export function getTimer(): number {
  return timer;
}

export function setTimer(interval: number) {
  timer = interval;
}

export function getOpenPorts() {
  return openPorts;
}

export function setOpenPort(port: number, value: any) {
  openPorts[port] = value;
}
export function deleteOpenPort(port: number) {
  delete openPorts[port];
}

export function getPortsNonce(): number {
  return portsNonce;
}
export function increasePortsNonce() {
  portsNonce++;
}

export function addQuery(nonce: any, func: Function) {
  queries[nonce] = func;
}

export function getQueries() {
  return queries;
}

export function getQuery(nonce: any) {
  return queries[nonce];
}

export function deleteQuery(nonce: any) {
  delete queries[nonce];
}
export function clearOpenPorts() {
  openPorts = {};
}

export function getKernelIframe(): HTMLIFrameElement {
  return kernelFrame;
}

export function setKernelIframe(iframe: HTMLIFrameElement) {
  kernelFrame = iframe;
}
