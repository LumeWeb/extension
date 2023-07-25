import BaseProvider from "./baseProvider.js";
import type {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types.js";
import browser from "webextension-polyfill";
import { requestProxies } from "../util.js";

export default class InternalProvider extends BaseProvider {
  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType,
  ): Promise<boolean> {
    return ["http://kernel.lume/"].includes(details.url);
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

    // Otherwise do nothing.
    return false;
  }

  async handleHeaders(
    details: OnHeadersReceivedDetailsType,
  ): Promise<OnRequestDetailsType | boolean> {
    if (details.url === "http://kernel.lume/") {
      let headers = [
        {
          name: "content-type",
          value: "text/html; charset=utf8",
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
