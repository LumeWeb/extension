import browser from "@lumeweb/webextension-polyfill";

import BaseProvider from "./contentProviders/baseProvider.js";
import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnCompletedDetailsType,
  OnErrorOccurredDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "./types";

export default class WebEngine {
  private contentProviders: BaseProvider[] = [];
  private requests: Map<string, OnBeforeRequestDetailsType> = new Map();

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
    const def = { responseHeaders: details.responseHeaders };
    if (!this.requests.has(details.requestId)) {
      return def;
    }

    for (const provider of this.contentProviders) {
      const response = await provider.handleHeaders(details);
      if (response !== false) {
        return response as BlockingResponse;
      }
    }

    return def;
  }

  private async proxyHandler(details: OnRequestDetailsType): Promise<any> {
    let handle = false;
    for (const provider of this.contentProviders) {
      if (await provider.shouldHandleRequest(details)) {
        handle = true;
        break;
      }
    }

    if (!handle) {
      return {};
    }

    this.requests.set(details.requestId, details);

    for (const provider of this.contentProviders) {
      const response = await provider.handleProxy(details);
      if (response !== false) {
        return response as any;
      }
    }

    return {};
  }

  private async requestHandler(
    details: OnBeforeRequestDetailsType
  ): Promise<BlockingResponse> {
    if (!this.requests.has(details.requestId)) {
      return {};
    }

    for (const provider of this.contentProviders) {
      const response = await provider.handleRequest(details);
      if (response !== false) {
        return response as BlockingResponse;
      }
    }

    return {};
  }

  private async onCompletedHandler(
    details: OnCompletedDetailsType
  ): Promise<void> {
    if (this.requests.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }
  }

  private async onErrorHandler(
    details: OnErrorOccurredDetailsType
  ): Promise<void> {
    if (this.requests.has(details.requestId)) {
      this.requests.delete(details.requestId);
    }
  }

  public registerContentProvider(provider: BaseProvider) {
    if (this.contentProviders.includes(provider)) {
      return;
    }

    this.contentProviders.push(provider);
  }
}
