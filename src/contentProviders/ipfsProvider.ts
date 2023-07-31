import BaseProvider from "./baseProvider.js";
import type {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types.js";
import { getRelayProxies } from "../util.js";
import { ipfsPath, ipnsPath, path as checkPath } from "is-ipfs";
import { createClient } from "@lumeweb/kernel-ipfs-client";
import type { DNSResult } from "@lumeweb/libresolver";
import { DNS_RECORD_TYPE } from "@lumeweb/libresolver";
import RequestStream from "../requestStream.js";
import type { UnixFSStats } from "@helia/unixfs";
import * as path from "path";
import { CID } from "multiformats/cid";
import { fileTypeFromBuffer } from "file-type";
import extToMimes from "../mimes.js";
import { stringToUint8Array } from "binconv";

export default class IpfsProvider extends BaseProvider {
  private _client = createClient();

  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType,
  ): Promise<boolean> {
    let dnsResult: DNSResult | boolean | string = await this.resolveDns(
      details,
      [DNS_RECORD_TYPE.CONTENT, DNS_RECORD_TYPE.TEXT],
    );
    if (!dnsResult) {
      return false;
    }
    let contentRecords = (dnsResult as DNSResult).records.map(
      (item: { value: string }) =>
        "/" + item.value.replace("://", "/").replace(/^\+/, "/"),
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
    details: OnBeforeSendHeadersDetailsType,
  ): Promise<BlockingResponse | boolean> {
    return {
      requestHeaders: [
        { name: "x-status", value: this.getData(details, "status") },
      ],
    };
  }

  async handleRequest(
    details: OnBeforeRequestDetailsType,
  ): Promise<BlockingResponse | boolean> {
    let urlObj = new URL(details.url);
    let urlPath = urlObj.pathname;
    let cid = this.getData(details, "cid");
    let err;
    let stat: UnixFSStats | null = null;
    const parsedPath = path.parse(urlPath);
    cid = cid.replace("ipns://", "/ipns/");
    cid = cid.replace("ipfs://", "/ipfs/");
    try {
      if (ipnsPath(cid)) {
        const cidHash = cid.replace("/ipns/", "");
        cid = await this._client.ipns(cidHash);
        cid = `/ipfs/${cid}`;
      }

      if (ipfsPath(cid)) {
        cid = CID.parse(cid.replace("/ipfs/", "")).toV1().toString();
        stat = await this._client.stat(cid);
      }
    } catch (e) {
      err = (e as Error).message;
    }

    if (err) {
      err = "404";
    }

    if (!err && stat?.type === "directory") {
      if (!parsedPath.base.length || !parsedPath.ext.length) {
        let found = false;
        for (const indexFile of ["index.html", "index.htm"]) {
          try {
            const subPath = path.join(urlPath, indexFile);
            await this._client.stat(cid, {
              path: subPath,
            });
            urlPath = subPath;
            found = true;
            break;
          } catch {}
        }

        if (!found) {
          err = "404";
        }
      }
    }
    const reqStream = new RequestStream(details);
    reqStream.start();

    if (err) {
      const streamWriter = reqStream.stream.writable.getWriter();
      streamWriter.write(stringToUint8Array("failed loading web3 page"));
      streamWriter.releaseLock();
      reqStream.close();
      return {};
    }

    let reader = await this._client.cat(cid, { path: urlPath });

    let bufferRead = 0;
    const fileTypeBufferLength = 4100;
    const mimeBuffer: Uint8Array[] = [];

    for await (const chunk of reader.iterable()) {
      if (bufferRead < fileTypeBufferLength) {
        if (chunk.length >= fileTypeBufferLength) {
          mimeBuffer.push(chunk.slice(0, fileTypeBufferLength));
          bufferRead += fileTypeBufferLength;
        } else {
          mimeBuffer.push(chunk);
          bufferRead += chunk.length;
        }

        if (bufferRead >= fileTypeBufferLength) {
          reader.abort();
          break;
        }
      } else {
        reader.abort();
        break;
      }
    }

    if (bufferRead >= fileTypeBufferLength) {
      const mime = await fileTypeFromBuffer(
        mimeBuffer.reduce((acc, val) => {
          return new Uint8Array([...acc, ...val]);
        }, new Uint8Array()),
      );

      if (mime) {
        this.setData(details, "contentType", mime.mime);
      }

      if (!mime) {
        const ext = path.parse(urlPath).ext.replace(".", "");
        if (extToMimes.has(ext)) {
          this.setData(details, "contentType", extToMimes.get(ext));
        }
      }
    }

    reader = await this._client.cat(cid, { path: urlPath });
    const streamWriter = reqStream.stream.writable.getWriter();

    let streaming = (async function () {
      try {
        // @ts-ignore
        for await (const chunk of reader.iterable()) {
          streamWriter.write(chunk);
        }
      } catch (e) {
        streamWriter.releaseLock();
        reqStream.close();
        return;
      }

      streamWriter.releaseLock();
      reqStream.close();
    })();

    return {};
  }

  async handleHeaders(
    details: OnHeadersReceivedDetailsType,
  ): Promise<BlockingResponse | boolean> {
    let headers: any = [];
    headers.push({
      name: "Content-Type",
      value: this.getData(details, "contentType"),
    });

    return {
      responseHeaders: headers,
    };
  }
}
