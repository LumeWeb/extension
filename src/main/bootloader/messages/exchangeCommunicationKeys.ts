import { bytesToHex, hexToBytes } from "@lumeweb/libweb";
import {
  getCommunicationPubKey,
  setFrontendCommunicationPubkey,
} from "../vars.js";
import { log } from "../util.js";

export default function (data: any) {
  setFrontendCommunicationPubkey(hexToBytes(data));

  return bytesToHex(getCommunicationPubKey());
}
