import BaseProvider from "./baseProvider.js";
import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
  StreamFilter,
} from "../types.js";
import { getRelayProxies, streamToArray } from "../util.js";
import { ipfsPath, ipnsPath, path } from "is-ipfs";
import {
  fetchIpfs,
  fetchIpns,
  statIpfs,
  statIpns,
} from "@lumeweb/kernel-ipfs-client";
import ejs from "ejs";
import { cacheDb } from "../databases.js";
import { DNS_RECORD_TYPE, DNSResult } from "@lumeweb/libresolver";
import RequestStream from "../requestStream.js";
import ContentFilterRegistry from "../contentFilterRegistry.js";

const INDEX_HTML_FILES = ["index.html", "index.htm", "index.shtml"];

const DIRECTORY_TEMPLATE = ejs.compile(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title><%= path %></title>
  <style></style>
</head>
<body>
  <div id="header" class="row">
    <div class="col-xs-2">
      <div id="logo" class="ipfs-logo"></div>
    </div>
  </div>
  <br>
  <div class="col-xs-12">
    <div class="panel panel-default">
      <div class="panel-heading">
        <strong>Index of <%= path %></strong>
      </div>
      <table class="table table-striped">
        <tbody>
          <tr>
            <td class="narrow">
              <div class="ipfs-icon ipfs-_blank">&nbsp;</div>
            </td>
            <td class="padding">
              <a href="<%= parentHref %>">..</a>
            </td>
            <td></td>
          </tr>
          <% links.forEach(function (link) { %>
          <tr>
            <td><div class="ipfs-icon ipfs-_blank">&nbsp;</div></td>
            <td><a href="<%= link.link %>"><%= link.name %></a></t>
            <td><%= link.size %></td>
          </td>
          </tr>
          <% }) %>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`);

interface StatFileResponse {
  exists: boolean;
  contentType: string | null;
  error: any;
  directory: boolean;
  files: StatFileSubfile[];
  timeout: boolean;
  size: number;
}

interface StatFileSubfile {
  name: string;
  size: number;
}

const MAX_CACHE_SIZE = 1024 * 1024 * 1024 * 50;

export default class IpfsProvider extends BaseProvider {
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
      (item) => "/" + item.value.replace("://", "/").replace(/^\+/, "/")
    );

    contentRecords = contentRecords.filter((item) => path(item));
    if (!contentRecords.length) {
      return false;
    }

    this.setData(details, "hash", contentRecords.shift());

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
    let hash = this.getData(details, "hash");
    let resp: StatFileResponse | null = null;
    let fetchMethod: typeof fetchIpfs | typeof fetchIpns;
    let err;
    let contentType: string;
    if (urlObj.protocol == "https") {
      urlObj.protocol = "http";
      return { redirectUrl: urlObj.toString() };
    }
    let contentSize = 0;

    let cachedPage: { contentType: string; data: Blob } | null = null;

    try {
      // @ts-ignore
      cachedPage = await cacheDb.items.where("url").equals(details.url).first();
    } catch {}

    if (!cachedPage) {
      try {
        if (ipfsPath(hash)) {
          hash = hash.replace("/ipfs/", "");
          resp = await statIpfs(hash.replace("/ipfs/", ""), urlPath);
          fetchMethod = fetchIpfs;
        } else if (ipnsPath(hash)) {
          hash = hash.replace("/ipns/", "");
          resp = await statIpns(hash.replace("/ipns/", ""), urlPath);
          fetchMethod = fetchIpns;
        } else {
          err = "invalid content";
        }
      } catch (e: any) {
        err = (e as Error).message;
      }

      contentType = resp?.contentType as string;
      if (contentType?.includes(";")) {
        contentType = contentType?.split(";").shift() as string;
      }
      contentSize = resp?.size as number;
    } else {
      contentType = cachedPage.contentType;
      contentSize = cachedPage.data.size;
    }

    if (resp) {
      if (!resp.exists) {
        err = "404";
      }
      if (resp.directory) {
        contentType = "text/html";
      }
    }

    this.setData(details, "contentType", contentType);

    const isSmallFile = contentSize <= MAX_CACHE_SIZE;
    const reqStream = new RequestStream(
      details,
      isSmallFile && ContentFilterRegistry.hasFilters(contentType)
        ? ContentFilterRegistry.filter(contentType)
        : undefined
    );
    reqStream.start();

    if (err) {
      reqStream.close();
      return {};
    }

    if (cachedPage) {
      (
        cachedPage?.data.stream() as unknown as ReadableStream<Uint8Array>
      ).pipeThrough(reqStream.stream);
      return {};
    }
    if (resp?.directory) {
      let indexFiles =
        resp?.files.filter((item) => INDEX_HTML_FILES.includes(item.name)) ||
        [];

      if (indexFiles.length > 0) {
        urlPath += `/${indexFiles[0].name}`;
      }
    }

    if (isSmallFile) {
      streamToArray(reqStream.readableStream).then((data: Uint8Array) => {
        // @ts-ignore
        return cacheDb.items.put({
          url: details.url,
          contentType,
          data: new Blob([data.buffer], { type: contentType }),
          timestamp: Date.now(),
        });
      });
    }

    const streamWriter = reqStream.stream.writable.getWriter();

    // @ts-ignore
    fetchMethod?.(hash, urlPath, (data: Buffer) => {
      streamWriter.write(data);
    }).then(() => {
      streamWriter.releaseLock();
      return reqStream.close();
    });

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
