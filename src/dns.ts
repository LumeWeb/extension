import NodeCache from "node-cache";
import { resolve as resolveDns } from "@lumeweb/kernel-dns-client";
import {
  DNS_RECORD_TYPE,
  DNSRecord,
  DNSResult,
  ResolverOptions,
} from "@lumeweb/libresolver";
import { blake2b, bufToHex, Err } from "libskynet/dist";

const cache = new NodeCache({ stdTTL: 60 });

export async function resolve(
  domain: string,
  options?: ResolverOptions,
  bypassCache = false
): Promise<DNSResult | Error> {
  let cacheId = `${domain}:${bufToHex(
    blake2b(new TextEncoder().encode(JSON.stringify(options)))
  )}`;

  if (cache.has(cacheId)) {
    cache.ttl(cacheId);
    return cache.get(cacheId) as DNSResult;
  }

  let res;
  try {
    res = await resolveDns(domain, options, bypassCache);
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
  bypassCache = false
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
