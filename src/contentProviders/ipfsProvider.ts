import BaseProvider from "./baseProvider.js";
import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
  StreamFilter,
} from "../types.js";
import { requestProxies } from "../util.js";
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

export default class IpfsProvider extends BaseProvider {
  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<boolean> {
    let dns = await this.resolveDns(details);
    if (dns) {
      dns = "/" + dns.replace("://", "/");
      dns = dns.replace(/^\+/, "/");
    }

    if (dns && path(dns)) {
      this.setData(details, "hash", dns);
      return true;
    }

    return false;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any> {
    return requestProxies;
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

    if (urlObj.protocol == "https") {
      urlObj.protocol = "http";
      return { redirectUrl: urlObj.toString() };
    }

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

    let contentType = resp?.contentType;
    let contentLength = resp?.size;

    let status = "200";

    if (contentType?.includes(";")) {
      contentType = contentType?.split(";").shift();
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
    this.setData(details, "contentLength", contentLength);

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

    const buffer: Uint8Array[] = [];

    const receiveUpdate = (chunk: Uint8Array) => {
      if (
        Object.keys(contentModes).includes(contentType as string) &&
        [CONTENT_MODE_CHUNKED, CONTENT_MODE_BUFFERED].includes(
          contentModes[contentType as string]
        )
      ) {
        buffer.push(chunk);
        return;
      }

      filterPromise.then(() => {
        streamPromise = streamPromise.then(() => {
          filter.write(chunk);
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
        contentLength = renderedDirectory.length;
        receiveUpdate(new TextEncoder().encode(renderedDirectory));
        filterPromise
          .then(() => streamPromise)
          .then(() => {
            filter.close();
          });
        this.setData(details, "contentLength", contentLength);
        return {};
      }
    }
    // @ts-ignore
    fetchMethod?.(hash, urlPath, receiveUpdate)
      .then(() => streamPromise)
      .then(() => {
        if (buffer.length) {
          let mode = contentModes[contentType as string];
          if (mode === CONTENT_MODE_BUFFERED) {
            let data: string | Uint8Array = Uint8Array.from(
              buffer.reduce(
                (previousValue: Uint8Array, currentValue: Uint8Array) => {
                  return Uint8Array.from([...previousValue, ...currentValue]);
                }
              )
            );
            if (contentType === "application/javascript") {
              data = new TextDecoder("utf-8", { fatal: true }).decode(data);
              data = data.replace(
                /\/\/#\s*sourceMappingURL=([^\.]+)\.js.map/,
                ""
              );
              data = new TextEncoder().encode(data);
            }
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
        filter.close();
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
    //   const contentLength = this.getData(details, "contentLength");

    headers.push({
      name: "Content-Type",
      value: this.getData(details, "contentType"),
    });

    /*    if (contentLength) {
          headers.push({
            name: "content-length",
            value: contentLength,
          });
        }*/

    return {
      responseHeaders: headers,
    };
  }
}
