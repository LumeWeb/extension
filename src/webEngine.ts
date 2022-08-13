import browser from "@lumeweb/webextension-polyfill";

import BaseProvider from "./contentProviders/baseProvider.js";
import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnCompletedDetailsType,
  OnErrorOccurredDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "./types";

export default class WebEngine {
  private contentProviders: BaseProvider[] = [];
  private requests: Map<string, BaseProvider> = new Map();
  private requestData: Map<string, {}> = new Map();

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
}
