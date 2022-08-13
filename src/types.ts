import { WebRequest, Proxy } from "webextension-polyfill";
import OnHeadersReceivedDetailsType = WebRequest.OnHeadersReceivedDetailsType;
import OnBeforeRequestDetailsType = WebRequest.OnBeforeRequestDetailsType;
import OnBeforeSendHeadersDetailsType = WebRequest.OnBeforeSendHeadersDetailsType;
import OnCompletedDetailsType = WebRequest.OnCompletedDetailsType;
import OnErrorOccurredDetailsType = WebRequest.OnErrorOccurredDetailsType;
import BlockingResponse = WebRequest.BlockingResponse;
import OnRequestDetailsType = Proxy.OnRequestDetailsType;
import HttpHeaders = WebRequest.HttpHeaders;
import StreamFilter = WebRequest.StreamFilter;
import HttpHeadersItemType = WebRequest.HttpHeadersItemType;

export {
  OnHeadersReceivedDetailsType,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnCompletedDetailsType,
  OnErrorOccurredDetailsType,
  BlockingResponse,
  OnRequestDetailsType,
  HttpHeaders,
  StreamFilter,
  HttpHeadersItemType,
};
