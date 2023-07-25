import browser from "webextension-polyfill";
import BaseProvider from "./contentProviders/baseProvider.js";
import type {
  BlockingResponse,
  OnBeforeNavigateDetailsType,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnCompletedDetailsType,
  OnErrorOccurredDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "./types.js";
import { getTld, isDomain, isIp, normalizeDomain } from "./util.js";
import tldEnum from "@lumeweb/tld-enum";
import { scanRecords } from "./dns.js";
import { bufToHex } from "@lumeweb/libweb";
import { getAuthStatus } from "./vars.js";
import type { DNSResult } from "@lumeweb/libresolver";
import { blake3 } from "@noble/hashes/blake3";

import "./contentFilters/index.js";

export default class WebEngine {
  private contentProviders: BaseProvider[] = [];
  private requests: Map<string, BaseProvider> = new Map();
  private requestData: Map<string, {}> = new Map();
  private navigations: Map<string, Promise<any>> = new Map();
  private domainContentProvider: Map<string, BaseProvider> = new Map();

  constructor() {
    browser.webRequest.onHeadersReceived.addListener(
      this.headerHandler.bind(this),
      { urls: ["<all_urls>"] },
      ["blocking", "responseHeaders"],
    );
    browser.proxy.onRequest.addListener(this.proxyHandler.bind(this), {
      urls: ["<all_urls>"],
    });
    browser.webRequest.onBeforeRequest.addListener(
      this.requestHandler.bind(this),
      { urls: ["<all_urls>"] },
      ["blocking"],
    );

    browser.webRequest.onBeforeSendHeaders.addListener(
      this.reqHeaderHandler.bind(this),
      { urls: ["<all_urls>"] },
      ["requestHeaders", "blocking"],
    );

    browser.webRequest.onCompleted.addListener(
      this.onCompletedHandler.bind(this),
      {
        urls: ["<all_urls>"],
      },
    );
    browser.webRequest.onErrorOccurred.addListener(
      this.onErrorHandler.bind(this),
      {
        urls: ["<all_urls>"],
      },
    );
    browser.webNavigation.onBeforeNavigate.addListener(
      this.handleNavigationRequest.bind(this),
    );
  }

  private async headerHandler(
    details: OnHeadersReceivedDetailsType,
  ): Promise<BlockingResponse> {
    return this.processHandler(details, "handleHeaders", {
      responseHeaders: details.responseHeaders,
    });
  }

  private async proxyHandler(details: OnRequestDetailsType): Promise<any> {
    let handle: BaseProvider | null = null;
    for (const provider of this.contentProviders) {
      if (await provider.shouldHandleRequest(details)) {
        handle = provider;
        break;
      }
    }

    if (!handle) {
      return {};
    }

    this.requests.set(details.requestId, handle);
    this.domainContentProvider.set(new URL(details.url).hostname, handle);

    return this.processHandler(details, "handleProxy");
  }

  private async requestHandler(
    details: OnBeforeRequestDetailsType,
  ): Promise<BlockingResponse> {
    const navId = this.getNavigationId(details);
    let navRedirect: boolean | string = false;
    if (this.navigations.has(navId)) {
      try {
        await this.navigations.get(navId);
      } catch (e: any) {
        navRedirect = e;
      }
    }

    if (navRedirect && navRedirect !== details.url) {
      return { redirectUrl: navRedirect as string };
    }

    const domainPatterns = {
      "eth.link": "eth",
      "eth.limo": "eth",
      "hns.is": "",
      "hns.to": "",
    } as { [pattern: string]: string };

    for (const pattern of Object.keys(domainPatterns)) {
      if (details.url.includes(pattern)) {
        return {
          redirectUrl: details.url.replace(pattern, domainPatterns[pattern]),
        };
      }
    }

    const provider = this.getRequestProvider(details.requestId);
    if (provider) {
      let urlObj = new URL(details.url);
      if (urlObj.protocol == "https") {
        urlObj.protocol = "http";
        return { redirectUrl: urlObj.toString() };
      }
    }

    return this.processHandler(details, "handleRequest");
  }

  private async reqHeaderHandler(
    details: OnBeforeSendHeadersDetailsType,
  ): Promise<BlockingResponse> {
    return this.processHandler(details, "handleReqHeaders");
  }

  private async onCompletedHandler(
    details: OnCompletedDetailsType,
  ): Promise<void> {
    if (this.requests.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }

    if (this.requestData.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }
  }

  private async onErrorHandler(
    details: OnErrorOccurredDetailsType,
  ): Promise<void> {
    if (this.requests.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }

    if (this.requestData.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }
  }

  public registerContentProvider(provider: BaseProvider) {
    if (
      this.contentProviders.filter(
        (item) => item.constructor.name === provider.constructor.name,
      ).length
    ) {
      return;
    }

    this.contentProviders.push(provider);
  }

  public getRequestData(requestId: string, key: string) {
    if (!this.requestData.has(requestId)) {
      return undefined;
    }

    const store: any = this.requestData.get(requestId);

    return store[key];
  }

  public setRequestData(requestId: string, key: string, value: any) {
    let store: any = {};

    if (this.requestData.has(requestId)) {
      store = this.requestData.get(requestId);
    }

    store[key] = value;

    this.requestData.set(requestId, store);
  }

  private async processHandler(
    details: any,
    method: string,
    def = {},
  ): Promise<BlockingResponse> {
    const provider = this.getRequestProvider(details.requestId);

    if (!provider) {
      return def;
    }
    const response = await provider[method](details);

    if (response !== false) {
      return response as BlockingResponse;
    }

    return def;
  }

  private async handleNavigationRequest(details: OnBeforeNavigateDetailsType) {
    if (!details.url) {
      return;
    }

    const originalUrl = new URL(details.url);
    const hostname = normalizeDomain(originalUrl.hostname);

    if (!isDomain(hostname) || isIp(hostname)) {
      return;
    }

    if (["chrome:"].includes(originalUrl.protocol)) {
      return;
    }

    if (!["google.com", "www.google.com"].includes(hostname)) {
      return;
    }
    if (
      !(
        originalUrl.searchParams.has("client") &&
        originalUrl.searchParams.get("client")?.includes("firefox")
      )
    ) {
      return;
    }

    let queriedUrl = originalUrl.searchParams.get("q") as string;
    if (!queriedUrl.includes("://")) {
      queriedUrl = `http://${queriedUrl}`;
    }
    let queriedHost = queriedUrl;
    try {
      let queriedUrlUbj = new URL(queriedUrl);
      queriedHost = queriedUrlUbj.hostname;
    } catch {}

    if (tldEnum.list.includes(getTld(queriedHost))) {
      return;
    }

    if (isIp(queriedHost)) {
      return;
    }

    if (/[\s_]/.test(queriedHost)) {
      return;
    }
    let dnsResult: boolean | DNSResult = false;

    let resolveRequest: any, rejectRequest: any;

    let promise = new Promise((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });

    this.navigations.set(this.getNavigationId(details), promise);

    if ("kernel.lume" === queriedHost) {
      if (!queriedUrl.includes("://")) {
        queriedUrl = `http://${queriedUrl}`;
      }
      rejectRequest(queriedUrl);
      return;
    }

    if (!getAuthStatus().loginComplete) {
      resolveRequest();
      return;
    }

    try {
      dnsResult = await scanRecords(queriedHost);
    } catch (e) {
      resolveRequest();
      return;
    }

    if (!dnsResult) {
      resolveRequest();
      return;
    }

    if (!queriedUrl.includes("://")) {
      queriedUrl = `http://${queriedUrl}`;
    }

    rejectRequest(queriedUrl);
  }

  private getNavigationId(details: any) {
    return `${details.tabId}_${bufToHex(blake3(details.url))}`;
  }

  public getDomainContentProvider(domain: string): BaseProvider | null {
    return this.domainContentProvider.get(domain) ?? null;
  }

  private getRequestProvider(
    requestId: string,
  ): { [p: string]: Function } | null {
    const provider = this.requests.get(requestId) as unknown as {
      [index: string]: Function;
    };
    return provider ?? null;
  }
}
