import BaseProvider from "./baseProvider.js";
import { OnBeforeRequestDetailsType, OnRequestDetailsType } from "../types.js";
import { isDomain, isIp } from "../util.js";
import { DNS_RECORD_TYPE, DNSRecord, DNSResult } from "@lumeweb/libresolver";

export default class ServerProvider extends BaseProvider {
  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<boolean> {
    let dnsResult: DNSResult | boolean = await this.resolveDns(details, [
      DNS_RECORD_TYPE.A,
      DNS_RECORD_TYPE.CNAME,
    ]);

    if (!dnsResult) {
      return false;
    }

    dnsResult = dnsResult as DNSResult;

    let dnsRecord = dnsResult.records.shift()?.value as string;

    if (isDomain(dnsRecord) || isIp(dnsRecord)) {
      this.setData(details, "server", dnsRecord);
      return true;
    }

    return false;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any> {
    const server = this.getData(details, "server");

    return { type: "http", host: server, port: 80 };
  }
}
