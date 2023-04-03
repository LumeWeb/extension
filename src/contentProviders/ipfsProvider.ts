import BaseProvider from "./baseProvider.js";
import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
  StreamFilter,
} from "../types.js";
import { getRelayProxies } from "../util.js";
import { ipfsPath, ipnsPath, path as checkPath } from "is-ipfs";
import { createClient } from "@lumeweb/kernel-ipfs-client";
import { DNS_RECORD_TYPE, DNSResult } from "@lumeweb/libresolver";
import RequestStream from "../requestStream.js";
import ContentFilterRegistry from "../contentFilterRegistry.js";
import { UnixFSStats } from "@helia/unixfs";
import * as path from "path";

export default class IpfsProvider extends BaseProvider {
  private _client = createClient();
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

    let contentRecords = (dnsResult as DNSResult).records.map(
      (item: { value: string }) =>
        "/" + item.value.replace("://", "/").replace(/^\+/, "/")
    );

    contentRecords = contentRecords.filter((item) => checkPath(item));
    if (!contentRecords.length) {
      return false;
    }

    this.setData(details, "cid", contentRecords.shift());

    return true;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any> {
    return getRelayProxies();
  }

  async handleReqHeaders(
    details: OnBeforeSendHeadersDetailsType
  ): Promise<BlockingResponse | boolean> {
    return {
      requestHeaders: [
        { name: "x-status", value: this.getData(details, "status") },
      ],
    };
  }

  async handleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<BlockingResponse | boolean> {
    let urlObj = new URL(details.url);
    let urlPath = urlObj.pathname;
    const cid = this.getData(details, "cid");
    let err;
    let stat: UnixFSStats | null = null;

    let parsedPath = path.parse(urlPath);
    let contentSize;

    try {
      if (ipnsPath(parsedPath.root)) {
        let ipnsLookup = await this._client.ipns(cid);
        stat = await this._client.stat(ipnsLookup);
      } else if (ipfsPath(parsedPath.root)) {
        stat = await this._client.stat(cid);
      }
    } catch (e) {
      err = (e as Error).message;
    }

    if (err) {
      err = "404";
    }

    // this.setData(details, "contentType", contentType);

    const reqStream = new RequestStream(
      details
      /* ContentFilterRegistry.hasFilters(contentType)
        ? ContentFilterRegistry.filter(contentType)
        : undefined*/
    );
    reqStream.start();

    if (err) {
      reqStream.close();
      return {};
    }
    const streamWriter = reqStream.stream.writable.getWriter();

    const reader = this._client.cat(parsedPath.root, { path: parsedPath.dir });

    (async function () {
      try {
        for await (const chunk of reader.iterable) {
          streamWriter.write(chunk);
        }
      } catch {
        streamWriter.releaseLock();
        reqStream.close();
      }
    })();

    return {};
  }

  async handleHeaders(
    details: OnHeadersReceivedDetailsType
  ): Promise<BlockingResponse | boolean> {
    let headers = [];

    headers.push({
      name: "Content-Type",
      value: this.getData(details, "contentType"),
    });

    return {
      responseHeaders: headers,
    };
  }
}
