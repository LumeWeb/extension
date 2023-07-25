let communicationKey: Uint8Array;
let remoteCommunicationKey: Uint8Array;

export function setCommunicationKey(key: Uint8Array) {
  communicationKey = key;
}

export function getCommunicationKey() {
  return communicationKey;
}
export function setRemoteCommunicationKey(key: Uint8Array) {
  remoteCommunicationKey = key;
}

export function getRemoteCommunicationKey() {
  return remoteCommunicationKey;
}
