import { WebRequest, Proxy } from "webextension-polyfill";
import OnHeadersReceivedDetailsType = WebRequest.OnHeadersReceivedDetailsType;
import OnBeforeRequestDetailsType = WebRequest.OnBeforeRequestDetailsType;
import OnCompletedDetailsType = WebRequest.OnCompletedDetailsType;
import OnErrorOccurredDetailsType = WebRequest.OnErrorOccurredDetailsType;
import BlockingResponse = WebRequest.BlockingResponse;
import OnRequestDetailsType = Proxy.OnRequestDetailsType;

export {
  OnHeadersReceivedDetailsType,
  OnBeforeRequestDetailsType,
  OnCompletedDetailsType,
  OnErrorOccurredDetailsType,
  BlockingResponse,
  OnRequestDetailsType,
};
