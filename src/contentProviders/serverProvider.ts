import BaseProvider from "./baseProvider.js";
import {
  BlockingResponse,
  HttpHeaders,
  OnBeforeRequestDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types.js";
import { validSkylink } from "libskynet";
import { downloadSkylink, isDomain, isIp, requestProxies } from "../util.js";
import browser from "@lumeweb/webextension-polyfill";

export default class ServerProvider extends BaseProvider {
  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<boolean> {
    const dns = await this.resolveDns(details);

    if (dns && (isDomain(dns) || isIp(dns))) {
      return true;
    }

    return false;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any> {
    const dns = await this.resolveDns(details);

    return { type: "http", host: dns, port: 80 };
  }
}
