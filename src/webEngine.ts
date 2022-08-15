import browser from "@lumeweb/webextension-polyfill";

import BaseProvider from "./contentProviders/baseProvider.js";
import {
  BlockingResponse,
  OnBeforeNavigateDetailsType,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnCompletedDetailsType,
  OnErrorOccurredDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "./types";
import { getTld, isDomain, isIp, normalizeDomain } from "./util.js";
import tldEnum from "@lumeweb/tld-enum";
import { resolve } from "./dns.js";
import { blake2b, bufToHex } from "libskynet";
import { getAuthStatus } from "./main/vars.js";

export default class WebEngine {
  private contentProviders: BaseProvider[] = [];
  private requests: Map<string, BaseProvider> = new Map();
  private requestData: Map<string, {}> = new Map();
  private navigations: Map<string, Promise<any>> = new Map();

  constructor() {
    browser.webRequest.onHeadersReceived.addListener(
      this.headerHandler.bind(this),
      { urls: ["<all_urls>"] },
      ["blocking", "responseHeaders"]
    );
    browser.proxy.onRequest.addListener(this.proxyHandler.bind(this), {
      urls: ["<all_urls>"],
    });
    browser.webRequest.onBeforeRequest.addListener(
      this.requestHandler.bind(this),
      { urls: ["<all_urls>"] },
      ["blocking"]
    );

    browser.webRequest.onBeforeSendHeaders.addListener(
      this.reqHeaderHandler.bind(this),
      { urls: ["<all_urls>"] },
      ["requestHeaders", "blocking"]
    );

    browser.webRequest.onCompleted.addListener(
      this.onCompletedHandler.bind(this),
      {
        urls: ["<all_urls>"],
      }
    );
    browser.webRequest.onErrorOccurred.addListener(
      this.onErrorHandler.bind(this),
      {
        urls: ["<all_urls>"],
      }
    );
    browser.webNavigation.onBeforeNavigate.addListener(
      this.handleNavigationRequest.bind(this)
    );
  }

  private async headerHandler(
    details: OnHeadersReceivedDetailsType
  ): Promise<BlockingResponse> {
    return this.processHandler(details, "handleHeaders", {
      responseHeaders: details.responseHeaders,
    });
  }

  private async proxyHandler(details: OnRequestDetailsType): Promise<any> {
    let handle = null;
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

    return this.processHandler(details, "handleProxy");
  }

  private async requestHandler(
    details: OnBeforeRequestDetailsType
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

    return this.processHandler(details, "handleRequest");
  }

  private async reqHeaderHandler(
    details: OnBeforeSendHeadersDetailsType
  ): Promise<BlockingResponse> {
    return this.processHandler(details, "handleReqHeaders");
  }
  private async onCompletedHandler(
    details: OnCompletedDetailsType
  ): Promise<void> {
    if (this.requests.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }

    if (this.requestData.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }
  }

  private async onErrorHandler(
    details: OnErrorOccurredDetailsType
  ): Promise<void> {
    if (this.requests.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }

    if (this.requestData.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }
  }

  public registerContentProvider(provider: BaseProvider) {
    if (this.contentProviders.includes(provider)) {
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
    def = {}
  ): Promise<BlockingResponse> {
    const provider = this.requests.get(details.requestId) as unknown as {
      [index: string]: Function;
    };

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

    if (!isDomain(details.url) || isIp(details.url)) {
      return;
    }

    const originalUrl = new URL(details.url);
    const hostname = normalizeDomain(originalUrl.hostname);

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
      return false;
    }

    if (isIp(queriedHost)) {
      return;
    }

    if (/[\s_]/.test(queriedHost)) {
      return;
    }
    let dns;

    let resolveRequest: any, rejectRequest: any;

    let promise = new Promise((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });

    this.navigations.set(this.getNavigationId(details), promise);

    if ("kernel.skynet" === queriedHost) {
      if (!queriedUrl.includes("://")) {
        queriedUrl = `http://${queriedUrl}`;
      }
      rejectRequest(queriedUrl);
      return;
    }

    if (getAuthStatus().loginComplete !== true) {
      resolveRequest();
      return;
    }

    try {
      dns = await resolve(queriedHost, {});
    } catch (e) {
      resolveRequest();
      return;
    }

    if (!dns) {
      resolveRequest();
      return;
    }

    if (!queriedUrl.includes("://")) {
      queriedUrl = `http://${queriedUrl}`;
    }

    rejectRequest(queriedUrl);
  }

  private getNavigationId(details: any) {
    return `${details.tabId}_${bufToHex(
      blake2b(new TextEncoder().encode(details.url))
    )}`;
  }

  public static cancelRequest(tabId: number) {
    const handler = (details: OnBeforeRequestDetailsType): BlockingResponse => {
      if (details.tabId !== tabId) {
        return {};
      }
      browser.webRequest.onBeforeRequest.removeListener(handler);

      return { cancel: true };
    };

    browser.webRequest.onBeforeRequest.addListener(
      handler,
      { urls: ["<all_urls>"] },
      ["blocking"]
    );
  }
}
