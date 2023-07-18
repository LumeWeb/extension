import { Client } from "@lumeweb/libportal";
import { x25519 } from "@noble/curves/ed25519";

let loginComplete = false;
let logoutComplete = false;
let kernelLoaded = "not yet";
let bootloaderPortals: Client[] = [];
let communicationKey: Uint8Array;
let frontendCommunicationPubKey: Uint8Array;

var userKey: Uint8Array;

export const defaultKernelLink =
  "zduTNANa64PTCYQ7C3deppQCfcwg75cDTCRdKjWg1C6nWtNrz2PyHLkkcX";

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

export function getCommunicationKey() {
  if (!communicationKey) {
    communicationKey = x25519.utils.randomPrivateKey();
  }

  return communicationKey;
}

export function getCommunicationPubKey() {
  return x25519.getPublicKey(getCommunicationKey());
}

export function getFrontendCommunicationPubkey() {
  return frontendCommunicationPubKey;
}

export function setFrontendCommunicationPubkey(key: Uint8Array) {
  frontendCommunicationPubKey = key;
}
