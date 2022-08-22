import NodeCache from "node-cache";
import { resolve as resolveDns } from "@lumeweb/kernel-dns-client";
import { DNSResult, ResolverOptions } from "@lumeweb/libresolver";
import { blake2b, Err } from "libskynet/dist";

const cache = new NodeCache({ stdTTL: 60 });

export async function resolve(
  domain: string,
  options?: ResolverOptions,
  bypassCache = false
): Promise<DNSResult | Error> {
  let cacheId = `${domain}:{${blake2b(
    new TextEncoder().encode(JSON.stringify(options))
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
