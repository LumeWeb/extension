import BaseProvider from "./baseProvider.js";
import {
  BlockingResponse,
  HttpHeaders,
  OnBeforeRequestDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types.js";
import { validSkylink } from "libskynet";
import { downloadSkylink, getRelayProxies } from "../util.js";
import browser from "@lumeweb/webextension-polyfill";

export default class SkynetProvider extends BaseProvider {
  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<boolean> {
    const dns = await this.resolveDns(details);

    if (dns && validSkylink(dns)) {
      return true;
    }

    return false;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any> {
    return getRelayProxies();
  }

  async handleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<BlockingResponse | boolean> {
    const dns = await this.resolveDns(details);
    let urlObj = new URL(details.url);
    let path = urlObj.pathname;
    let fileData: any, err;

    if (urlObj.protocol == "https") {
      urlObj.protocol = "http";
      return { redirectUrl: urlObj.toString() };
    }

    try {
      [fileData, err] = await downloadSkylink(dns, path);
    } catch (e: any) {
      debugger;
      this.setData(details, "error", (e as Error).message);
      return {};
    }

    if (err) {
      this.setData(details, "error", err);
      return {};
    }

    this.setData(details, "headers", fileData.response?.headers);

    const filter = browser.webRequest.filterResponseData(details.requestId);

    filter.ondata = () => {};
    filter.onstop = () => {
      fileData.response.arrayBuffer().then((data: any) => {
        filter.write(data);
        filter.close();
      });
    };

    return true;
  }

  async handleHeaders(
    details: OnHeadersReceivedDetailsType
  ): Promise<BlockingResponse | boolean> {
    const err = this.getData(details, "error");
    let headers: Headers = this.getData(details, "headers") as Headers;

    if (err) {
      return {
        responseHeaders: [
          {
            name: "Status-Code",
            value: err == "404" ? "404" : "400",
          },
          {
            name: "Content-Type",
            value: "text/html; charset=utf8",
          },
        ],
      };
    }

    return {
      responseHeaders: Array.from(headers).map((item: string[]) => {
        return { name: item[0], value: item[1] };
      }),
    };
  }
}
