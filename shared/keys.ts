import { x25519 } from "@noble/curves/ed25519";
import {
  getCommunicationKey,
  getRemoteCommunicationKey,
  setCommunicationKey,
  setRemoteCommunicationKey,
} from "./vars.js";
import { queryBackground } from "./util.js";
import { bytesToHex, hexToBytes, randomBytes } from "@lumeweb/libweb";
import { secretbox } from "@noble/ciphers/salsa";

export function generateCommunicationKey() {
  return x25519.utils.randomPrivateKey();
}

export async function exchangeCommunicationKeys() {
  if (!getCommunicationKey()) {
    setCommunicationKey(generateCommunicationKey());
  }

  const pubKey = await queryBackground(
    "exchangeCommunicationKeys",
    bytesToHex(x25519.getPublicKey(getCommunicationKey())),
  );

  if (!pubKey) {
    throw new Error("could not get communication key");
  }

  setRemoteCommunicationKey(hexToBytes(pubKey));
}

export async function setLoginKey(key: Uint8Array) {
  await exchangeCommunicationKeys();
  const privKey = getCommunicationKey();
  const pubKey = getRemoteCommunicationKey();

  const secret = x25519.getSharedSecret(privKey, pubKey);
  const nonce = randomBytes(24);
  const box = secretbox(secret, nonce);
  const ciphertext = box.seal(key);

  await queryBackground("setLoginKey", {
    data: bytesToHex(ciphertext),
    nonce: bytesToHex(nonce),
  });
}
