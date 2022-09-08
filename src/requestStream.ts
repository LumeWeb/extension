import { OnBeforeRequestDetailsType, StreamFilter } from "./types.js";
import browser from "@lumeweb/webextension-polyfill";
import { iterateStream, streamToArray } from "./util.js";

export default class RequestStream {
  private _request: OnBeforeRequestDetailsType;
  private _filter: StreamFilter;
  private _contentFilter?: (data: Uint8Array) => Promise<Uint8Array>;
  private _readableStream: ReadableStream;

  constructor(
    request: OnBeforeRequestDetailsType,
    contentFilter?: (data: Uint8Array) => Promise<Uint8Array>
  ) {
    this._request = request;
    this._contentFilter = contentFilter;
    this._filter = browser.webRequest.filterResponseData(request.requestId);
    this._stream = new TransformStream<Uint8Array>();
    this._readableStream = this._stream.readable;
  }

  private _stream: TransformStream<Uint8Array>;

  get stream(): TransformStream {
    return this._stream;
  }

  get readableStream(): ReadableStream {
    const [a, b] = this._readableStream.tee();
    this._readableStream = a;

    return b;
  }

  public start(): void {
    this._filter.onstop = async () => {
      if (this._contentFilter) {
        const data = await this._contentFilter(
          await streamToArray(this._readableStream)
        );
        this._filter.write(data);
        this._filter.close();
        return;
      }
      for await (const chunk of iterateStream(this._readableStream)) {
        this._filter.write(chunk);
      }
      this._filter.close();
    };
  }

  public async close() {
    await this._stream.writable.close();
  }
}
