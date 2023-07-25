import type {
  WebRequest,
  Proxy,
  Tabs,
  WebNavigation,
  Menus,
} from "webextension-polyfill";
type OnHeadersReceivedDetailsType = WebRequest.OnHeadersReceivedDetailsType;
type OnBeforeRequestDetailsType = WebRequest.OnBeforeRequestDetailsType;
type OnBeforeSendHeadersDetailsType = WebRequest.OnBeforeSendHeadersDetailsType;
type OnCompletedDetailsType = WebRequest.OnCompletedDetailsType;
type OnErrorOccurredDetailsType = WebRequest.OnErrorOccurredDetailsType;
type BlockingResponse = WebRequest.BlockingResponse;
type OnRequestDetailsType = Proxy.OnRequestDetailsType;
type StreamFilter = WebRequest.StreamFilter;
type OnBeforeNavigateDetailsType = WebNavigation.OnBeforeNavigateDetailsType;

export type {
  OnHeadersReceivedDetailsType,
  OnBeforeRequestDetailsType,
  OnBeforeSendHeadersDetailsType,
  OnCompletedDetailsType,
  OnErrorOccurredDetailsType,
  BlockingResponse,
  OnRequestDetailsType,
  StreamFilter,
  Tabs,
  OnBeforeNavigateDetailsType,
  Menus,
};
