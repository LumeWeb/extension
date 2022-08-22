import BaseProvider from "./baseProvider.js";
import { OnBeforeRequestDetailsType, OnRequestDetailsType } from "../types.js";
import { isDomain, isIp } from "../util.js";
import { DNSRecord } from "@lumeweb/libresolver";

export default class ServerProvider extends BaseProvider {
  async shouldHandleRequest(
    details: OnBeforeRequestDetailsType
  ): Promise<boolean> {
    let dns: DNSRecord | boolean = await this.resolveDns(details);
    if (!dns) {
      return false;
    }
    dns = dns as DNSRecord;

    if (dns && (isDomain(dns.value) || isIp(dns.value))) {
      return true;
    }

    return false;
  }

  async handleProxy(details: OnRequestDetailsType): Promise<any> {
    const dns = await this.resolveDns(details);

    if (isIp(dns) || isDomain(dns)) {
      return { type: "http", host: dns, port: 80 };
    }

    return false;
  }
}
