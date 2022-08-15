import NodeCache from "node-cache";
import { resolve as resolveDns } from "@lumeweb/kernel-dns-client";

const cache = new NodeCache({ stdTTL: 60 });

export async function resolve(domain: string, params: any, force = false) {
  if (cache.has(domain)) {
    cache.ttl(domain);
    return cache.get(domain);
  }

  let res = await resolveDns(domain, params, force);

  if (res) {
    cache.set(domain, res);
  }

  return res;
}
