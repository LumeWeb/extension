import { secretbox } from "@noble/ciphers/salsa";
import { x25519 } from "@noble/curves/ed25519";
import {
  getCommunicationKey,
  getFrontendCommunicationPubkey,
  setLoginComplete,
} from "../vars.js";
import { saveUserKey } from "../storage.js";
import { hexToBytes } from "@lumeweb/libweb";

export default function (data: any) {
  const box = secretbox(
    x25519.getSharedSecret(
      getCommunicationKey(),
      getFrontendCommunicationPubkey(),
    ),
    hexToBytes(data.nonce),
  );
  const decryptedData = box.open(hexToBytes(data.data));

  setLoginComplete(false);

  saveUserKey(decryptedData);

  return true;
}
