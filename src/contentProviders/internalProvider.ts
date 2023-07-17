import BaseProvider from "./baseProvider.js";
import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types.js";
import browser from "webextension-polyfill";
import { RequestOverrideResponse } from "@lumeweb/libweb";
import { queryKernel } from "../main/background.js";
import { requestProxies } from "../util.js";

export default class InternalProvider extends BaseProvider {
  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType,
  ): Promise<boolean> {
    return [
      "http://kernel.lume/",
      "http://kernel.lume/auth.html",
      "http://kernel.lume/favicon.ico",
    ].includes(details.url);
  }

  async handleRequest(
    details: OnBeforeRequestDetailsType,
  ): Promise<BlockingResponse | boolean> {
    // For the kernel, we swallow the entire page. The 'bootloader' content
    // script will everything that we need.
    if (details.url === "http://kernel.lume/") {
      // Get the filter and swallow any response from the server.
      let filter = browser.webRequest.filterResponseData(details.requestId);
      filter.onstart = () => {
        filter.close();
      };
      return {};
    }

    // For the favicon, we make a request to a content script that has access
    // to the favicon.
    if (details.url === "http://kernel.lume/favicon.ico") {
      // Send a message to the kernel requesting an override for the
      // favicon.ico. The kernel is itself loading this favicon from the
      // browser, I just wasn't certain how to get binary objects directly to
      // the background page, so we fetch it via a content script instead.
      let faviconPromise = queryKernel({
        method: "requestOverride",
        data: {
          url: details.url,
          method: details.method,
        },
      });

      // Get the filter and swallow any response from the server. Setting
      // 'onData' to a blank function will swallow all data from the server.
      let filter = browser.webRequest.filterResponseData(details.requestId);
      filter.ondata = () => {
        // By setting 'ondata' to the emtpy function, we effectively ensure
        // that none of the data will be processed.
      };
      filter.onstop = () => {
        faviconPromise.then((result: RequestOverrideResponse) => {
          filter.write(result.body as Uint8Array);
          filter.close();
        });
      };
      return {};
    }

    // For the favicon, we make a request to a content script that has access
    // to the favicon.
    if (details.url === "http://kernel.lume/auth.html") {
      // Send a message to the kernel requesting an override for the auth
      // page. The kernel is itself loading the auth page from the browser, I
      // just wasn't certain how to get binary objects directly to the
      // background page, so we fetch it via a content script instead.
      let authPagePromise = queryKernel({
        method: "requestOverride",
        data: {
          url: details.url,
          method: details.method,
        },
      });

      // Get the filter and swallow any response from the server. Setting
      // 'onData' to a blank function will swallow all data from the server.
      let filter = browser.webRequest.filterResponseData(details.requestId);
      filter.ondata = () => {
        // By setting 'ondata' to the emtpy function, we effectively ensure
        // that none of the data will be processed.
      };
      filter.onstop = () => {
        authPagePromise.then((result: RequestOverrideResponse) => {
          filter.write(result.body as Uint8Array);
          filter.close();
        });
      };
      return {};
    }

    // Otherwise do nothing.
    return false;
  }

  async handleHeaders(
    details: OnHeadersReceivedDetailsType,
  ): Promise<OnRequestDetailsType | boolean> {
    if (
      details.url === "http://kernel.lume/" ||
      details.url === "http://kernel.lume/auth.html"
    ) {
      let headers = [
        {
          name: "content-type",
          value: "text/html; charset=utf8",
        },
      ];
      return { responseHeaders: headers } as unknown as OnRequestDetailsType;
    }

    // For the favicon, replace the headers with png headers.
    if (details.url === "http://kernel.lume/favicon.ico") {
      let headers = [
        {
          name: "content-type",
          value: "image/png",
        },
      ];
      return { responseHeaders: headers } as unknown as OnRequestDetailsType;
    }

    return false;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any> {
    const hostname = new URL(details.url).hostname;
    if (hostname === "kernel.lume") {
      return requestProxies;
    }

    return false;
  }
}
