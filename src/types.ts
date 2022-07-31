import { WebRequest, Proxy } from "webextension-polyfill";
import OnHeadersReceivedDetailsType = WebRequest.OnHeadersReceivedDetailsType;
import OnBeforeRequestDetailsType = WebRequest.OnBeforeRequestDetailsType;
import OnBeforeSendHeadersDetailsType = WebRequest.OnBeforeSendHeadersDetailsType;
import OnCompletedDetailsType = WebRequest.OnCompletedDetailsType;
import OnErrorOccurredDetailsType = WebRequest.OnErrorOccurredDetailsType;
import BlockingResponse = WebRequest.BlockingResponse;
import OnRequestDetailsType = Proxy.OnRequestDetailsType;
import HttpHeaders = WebRequest.HttpHeaders;

export {
  OnHeadersReceivedDetailsType,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnCompletedDetailsType,
  OnErrorOccurredDetailsType,
  BlockingResponse,
  OnRequestDetailsType,
  HttpHeaders,
};
