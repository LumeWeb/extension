import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types";
import WebEngine from "../webEngine.js";
import { getTld, isDomain, isIp, normalizeDomain } from "../util.js";
import tldEnum from "@lumeweb/tld-enum";
import { getAuthStatus } from "../main/vars.js";
import { resolve } from "../dns.js";
import { DNS_RECORD_TYPE } from "@lumeweb/libresolver";

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

  async handleReqHeaders(
    details: OnBeforeSendHeadersDetailsType
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

    if (getAuthStatus().loginComplete !== true) {
      return false;
    }

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

    let dnsResult;

    for (const type of [
      DNS_RECORD_TYPE.CONTENT,
      DNS_RECORD_TYPE.A,
      DNS_RECORD_TYPE.CNAME,
    ]) {
      let result = await resolve(hostname);

      if (result instanceof Error) {
        continue;
      }

      if (0 < result.records.length) {
        dnsResult = result.records.shift();
        break;
      }
    }

    if (!dnsResult) {
      dnsResult = false;
    }

    this.setData(details, "dns", dnsResult);

    return dnsResult;
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
