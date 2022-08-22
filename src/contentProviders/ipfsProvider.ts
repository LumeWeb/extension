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
import browser from "@lumeweb/webextension-polyfill";
import { ipfsPath, ipnsPath, path } from "is-ipfs";
import {
  fetchIpfs,
  fetchIpns,
  statIpfs,
  statIpns,
} from "@lumeweb/kernel-ipfs-client";
import ejs from "ejs";
import {
  CONTENT_MODE_BUFFERED,
  CONTENT_MODE_CHUNKED,
  contentModes,
} from "../mimes.js";
import { cacheDb } from "../databases.js";
import { DNS_RECORD_TYPE, DNSResult } from "@lumeweb/libresolver";

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
    } else {
      contentType = cachedPage.contentType;
    }

    let status = "200";

    if (resp) {
      if (!resp.exists) {
        err = "404";
      }
      if (resp.directory) {
        contentType = "text/html";
      }
    }

    this.setData(details, "contentType", contentType);

    if (err) {
      if (err === "NOT_FOUND") {
        err = "404";
      }
      if (err === "timeout") {
        err = "408";
      }
      if (err.includes("no link")) {
        err = "404";
      }

      this.setData(details, "error", err);

      if (!isNaN(parseInt(err))) {
        status = err;
      }
    }

    this.setData(details, "status", status);

    let filterPromiseResolve: any;
    let filterPromise = new Promise((resolve) => {
      filterPromiseResolve = resolve;
    });
    let streamPromise = Promise.resolve();
    const filter: StreamFilter = browser.webRequest.filterResponseData(
      details.requestId
    );
    filter.ondata = () => {};
    filter.onstop = () => {
      filterPromiseResolve();
    };

    let buffer: Uint8Array[] = [];
    let cacheBuffer: Uint8Array[] | Uint8Array = [];

    const receiveUpdate = (chunk: Uint8Array) => {
      if (!chunk.buffer.byteLength && chunk.byteOffset === 0) {
        return filterPromise;
      }
      if (
        Object.keys(contentModes).includes(contentType as string) &&
        [CONTENT_MODE_CHUNKED, CONTENT_MODE_BUFFERED].includes(
          contentModes[contentType as string]
        )
      ) {
        buffer.push(chunk);
        resp = resp as StatFileResponse;
        cacheBuffer = cacheBuffer as Uint8Array[];
        if (!cachedPage && resp.size <= MAX_CACHE_SIZE) {
          cacheBuffer.push(chunk);
        }

        return filterPromise;
      }

      return filterPromise.then(() => {
        streamPromise = streamPromise.then(() => {
          filter.write(chunk);
          cacheBuffer = cacheBuffer as Uint8Array[];
          cacheBuffer.push(chunk);
        });
      });
    };

    if (err) {
      //  receiveUpdate(new TextEncoder().encode(serverErrorTemplate()));
      filterPromise.then(() => streamPromise).then(() => filter.close());
      return {};
    }

    if (resp?.directory) {
      let indexFiles =
        resp?.files.filter((item) => INDEX_HTML_FILES.includes(item.name)) ||
        [];

      if (indexFiles.length > 0) {
        urlPath += `/${indexFiles[0].name}`;
      } else {
        const renderedDirectory = DIRECTORY_TEMPLATE(resp?.files);
        receiveUpdate(new TextEncoder().encode(renderedDirectory));
        filterPromise
          .then(() => streamPromise)
          .then(() => {
            filter.close();
          });
        return {};
      }
    }

    const handleBuffer = () => {
      if (buffer.length) {
        let mode = contentModes[contentType as string];
        buffer = buffer.map((item: Uint8Array | ArrayBuffer) => {
          if (item instanceof ArrayBuffer) {
            return new Uint8Array(item);
          }
          return item;
        });
        if (mode === CONTENT_MODE_BUFFERED) {
          let data: string | Uint8Array = Uint8Array.from(
            buffer.reduce(
              (previousValue: Uint8Array, currentValue: Uint8Array) => {
                return Uint8Array.from([...previousValue, ...currentValue]);
              }
            )
          );
          /*            if (contentType === "text/html") {
                  data = new TextDecoder("utf-8", { fatal: true }).decode(data);
                  let htmlDoc = new DOMParser().parseFromString(
                    data as string,
                    contentType
                  );
                  let found = htmlDoc.documentElement.querySelectorAll(
                    'meta[http-equiv="Content-Security-Policy"]'
                  );

                  if (found.length) {
                    found.forEach((item) => item.remove());
                    data = htmlDoc.documentElement.outerHTML;
                  }

                  data = new TextEncoder().encode(data);
                }*/
          filter.write(data);
        } else if (mode == CONTENT_MODE_CHUNKED) {
          buffer.forEach((data) => filter.write(data));
        }
      }
    };
    if (cachedPage) {
      // @ts-ignore
      cachedPage.data.arrayBuffer().then((data: ArrayBuffer) => {
        // @ts-ignore
        receiveUpdate(new Uint8Array(data))?.then(() => {
          handleBuffer();
          filterPromise.then(() => filter.close());
        });
      });

      return {};
    }

    // @ts-ignore
    fetchMethod?.(hash, urlPath, receiveUpdate)
      .then(() => streamPromise)
      .then(() => {
        handleBuffer();
        filterPromise.then(() => streamPromise).then(() => filter.close());
        resp = resp as StatFileResponse;
        if (resp.size <= MAX_CACHE_SIZE) {
          cacheBuffer = Uint8Array.from(
            (cacheBuffer as Uint8Array[]).reduce(
              (previousValue: Uint8Array, currentValue: Uint8Array) => {
                return Uint8Array.from([...previousValue, ...currentValue]);
              }
            )
          );

          // @ts-ignore
          return cacheDb.items.put({
            url: details.url,
            contentType,
            data: new Blob([cacheBuffer.buffer], { type: contentType }),
            timestamp: Date.now(),
          });
        }
      })
      .catch((e) => {
        console.error("page error", urlPath, e.message);
        /*        if (
                  urlPath.endsWith(".html") ||
                  urlPath.endsWith(".htm") ||
                  urlPath.endsWith(".xhtml") ||
                  urlPath.endsWith(".shtml")
                ) {
                  this.setData(details, "contentType", "text/html");
                  let template = serverErrorTemplate();
                  contentLength = template.length;
                  receiveUpdate(new TextEncoder().encode(template));
                  this.setData(details, "contentLength", contentLength);
                }*/
        filterPromise.then(() => streamPromise).then(() => filter.close());
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
