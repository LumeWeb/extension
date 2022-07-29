import {
  BlockingResponse,
  OnBeforeRequestDetailsType,
  OnHeadersReceivedDetailsType,
  OnRequestDetailsType,
} from "../types";
import WebEngine from "../webEngine.js";

export default abstract class BaseProvider {
  private engine: WebEngine;
  constructor(engine: WebEngine) {
    this.engine = engine;
  }

  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<boolean> {
    return false;
  }

  async handleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<BlockingResponse | boolean> {
    return false;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any | boolean> {
    return false;
  }

  async handleHeaders(
    details: OnHeadersReceivedDetailsType
  ): Promise<BlockingResponse | boolean> {
    return false;
  }
}
