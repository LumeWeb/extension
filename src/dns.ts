import NodeCache from "node-cache";
import {
  DNS_RECORD_TYPE,
  DNSResult,
  ResolverOptions,
} from "@lumeweb/libresolver";
import { bufToHex } from "@lumeweb/libweb";
import { getDnsSetupDefer } from "./vars.js";
import { dnsClient } from "./clients.js";
import { blake3 } from "@noble/hashes/blake3";

const cache = new NodeCache({ stdTTL: 60 });

export async function resolve(
  domain: string,
  options?: ResolverOptions,
  bypassCache = false,
): Promise<DNSResult | Error> {
  let cacheId = `${domain}:${bufToHex(blake3(JSON.stringify(options)))}`;

  if (cache.has(cacheId)) {
    cache.ttl(cacheId);
    return cache.get(cacheId) as DNSResult;
  }

  await getDnsSetupDefer().promise;

  let res;
  try {
    res = await dnsClient.resolve(domain, options, bypassCache);
  } catch (e: any) {
    return e as Error;
  }

  if (res) {
    cache.set(cacheId, res);
  }

  return res;
}

export async function scanRecords(
  domain: string,
  recordTypes?: string[],
  bypassCache = false,
): Promise<boolean | DNSResult> {
  let dnsResult: boolean | DNSResult = false;

  if (!recordTypes) {
    recordTypes = [
      DNS_RECORD_TYPE.CONTENT,
      DNS_RECORD_TYPE.A,
      DNS_RECORD_TYPE.CNAME,
    ];
  }

  for (const type of recordTypes) {
    let result = await resolve(domain, { type }, bypassCache);

    if (result instanceof Error) {
      continue;
    }

    if (0 < result.records.length) {
      dnsResult = result;
      break;
    }
  }

  return dnsResult;
}
