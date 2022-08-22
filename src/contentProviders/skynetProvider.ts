import BaseProvider from "./baseProvider.js";
import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types.js";
import { validSkylink } from "libskynet";
import { downloadSkylink, getRelayProxies } from "../util.js";
import browser from "@lumeweb/webextension-polyfill";
import { DNS_RECORD_TYPE, DNSResult } from "@lumeweb/libresolver";

export default class SkynetProvider extends BaseProvider {
  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<boolean> {
    let dnsResult: DNSResult | boolean | string = await this.resolveDns(
      details,
      [DNS_RECORD_TYPE.CONTENT, DNS_RECORD_TYPE.TEXT]
    );
    if (!dnsResult) {
      return false;
    }
    let contentRecords = (dnsResult as DNSResult).records
      .map((item) => {
        item.value = item.value.replace("sia://", "");
        return item;
      })
      .filter((item) => {
        try {
          return validSkylink(item.value);
        } catch (e) {
          return false;
        }
      });
    if (!contentRecords.length) {
      return false;
    }

    this.setData(details, "hash", contentRecords.shift()?.value);

    return true;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any> {
    return getRelayProxies();
  }

  async handleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<BlockingResponse | boolean> {
    const hash = this.getData(details, "hash");
    let urlObj = new URL(details.url);
    let path = urlObj.pathname;
    let fileData: any, err;

    if (urlObj.protocol == "https") {
      urlObj.protocol = "http";
      return { redirectUrl: urlObj.toString() };
    }

    try {
      [fileData, err] = await downloadSkylink(hash, path);
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
