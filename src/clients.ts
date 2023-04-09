import { createClient as createDnsClient } from "@lumeweb/kernel-dns-client";
import { createClient as createIpfsClient } from "@lumeweb/kernel-ipfs-client";
import { createClient as createSwarmClient } from "@lumeweb/kernel-swarm-client";
import { createClient as createPeerDiscoveryClient } from "@lumeweb/kernel-peer-discovery-client";

const dnsClient = createDnsClient();
const ipfsClient = createIpfsClient();
const swarmClient = createSwarmClient();
const peerDiscoveryClient = createPeerDiscoveryClient();

export { dnsClient, ipfsClient, swarmClient, peerDiscoveryClient };
