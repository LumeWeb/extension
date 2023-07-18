import { Client } from "@lumeweb/libportal";

let loginComplete = false;
let logoutComplete = false;
let kernelLoaded = "not yet";
let bootloaderPortals: Client[] = [];

var userKey: Uint8Array;

export const defaultKernelLink =
  "RAC1FocOb2bQw6uwjN0AX__MJ8F-h71F5kvIgQPTKo7fQA";

export function setLoginComplete(status: boolean) {
  loginComplete = status;
}
export function getLoginComplete() {
  return loginComplete;
}
export function setLogoutComplete(status: boolean) {
  logoutComplete = status;
}
export function getLogoutComplete() {
  return logoutComplete;
}
export function setKernelLoaded(status: string) {
  kernelLoaded = status;
}

export function getKernelLoaded() {
  return kernelLoaded;
}
export function setUserKey(key: Uint8Array) {
  userKey = key;
}
export function getUserKey() {
  return userKey;
}

export function setBootloaderPortals(portals: Client[]) {
  bootloaderPortals = portals;
}
