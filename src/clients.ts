import { createClient as createDnsClient } from "@lumeweb/kernel-dns-client";
import { createClient as createIpfsClient } from "@lumeweb/kernel-ipfs-client";

const dnsClient = createDnsClient();
const ipfsClient = createIpfsClient();

export { dnsClient, ipfsClient };
