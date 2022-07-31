import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types";
import WebEngine from "../webEngine.js";
import { getTld, isDomain, isIp, normalizeDomain } from "../util.js";
import tldEnum from "@lumeweb/tld-enum";
import { resolve } from "@lumeweb/kernel-dns-client";

export default abstract class BaseProvider {
  private engine: WebEngine;
  constructor(engine: WebEngine) {
    this.engine = engine;
  }

  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<boolean> {
    return false;
  }

  async handleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<BlockingResponse | boolean> {
    return false;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any | boolean> {
    return false;
  }

  async handleHeaders(
    details: OnHeadersReceivedDetailsType
  ): Promise<BlockingResponse | boolean> {
    return false;
  }

  protected async resolveDns(details: OnBeforeRequestDetailsType) {
    const originalUrl = new URL(details.url);
    const hostname = normalizeDomain(originalUrl.hostname);

    if (tldEnum.list.includes(getTld(hostname))) {
      return false;
    }

    if (isIp(hostname) && !isDomain(hostname)) {
      return false;
    }

    const cached = this.getData(details, "dns");

    if (cached !== undefined) {
      return cached;
    }

    let result;

    try {
      result = await resolve(hostname, {});
    } catch (e) {
      debugger;
    }
    if (!result) {
      this.setData(details, "dns", false);
      return false;
    }

    this.setData(details, "dns", result);

    return result;
  }

  protected getData(details: OnBeforeRequestDetailsType, key: string) {
    return this.engine.getRequestData(details.requestId, key);
  }

  protected setData(
    details: OnBeforeRequestDetailsType,
    key: string,
    value: any
  ) {
    return this.engine.setRequestData(details.requestId, key, value);
  }
}
