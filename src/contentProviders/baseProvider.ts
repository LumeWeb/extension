import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types.js";
import WebEngine from "../webEngine.js";
import { getTld, isDomain, isIp, normalizeDomain } from "../util.js";
import tldEnum from "@lumeweb/tld-enum";
import { getAuthStatus } from "../main/vars.js";
import { scanRecords } from "../dns.js";

export default abstract class BaseProvider {
  private engine: WebEngine;
  constructor(engine: WebEngine) {
    this.engine = engine;
  }

  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType,
  ): Promise<boolean> {
    return false;
  }

  async handleRequest(
    details: OnBeforeRequestDetailsType,
  ): Promise<BlockingResponse | boolean> {
    return false;
  }

  async handleReqHeaders(
    details: OnBeforeSendHeadersDetailsType,
  ): Promise<BlockingResponse | boolean> {
    return false;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any | boolean> {
    return false;
  }

  async handleHeaders(
    details: OnHeadersReceivedDetailsType,
  ): Promise<BlockingResponse | boolean> {
    return false;
  }

  protected async resolveDns(
    details: OnBeforeRequestDetailsType,
    recordTypes?: string[],
  ) {
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

    return await scanRecords(hostname, recordTypes);
  }

  protected getData(details: OnBeforeRequestDetailsType, key: string) {
    return this.engine.getRequestData(details.requestId, key);
  }

  protected setData(
    details: OnBeforeRequestDetailsType,
    key: string,
    value: any,
  ) {
    return this.engine.setRequestData(details.requestId, key, value);
  }
}
