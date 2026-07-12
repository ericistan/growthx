import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

export type HostResolver = (hostname: string) => Promise<string[]>;

const defaultResolver: HostResolver = async (hostname) => {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
};

const blockedAddresses = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blockedAddresses.check(address, "ipv4");
  if (family === 6) return !blockedAddresses.check(address, "ipv6");
  return false;
}

export async function validatePublicTargetUrl(
  rawUrl: string,
  resolveHost: HostResolver = defaultResolver,
): Promise<URL> {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Target URL must use HTTP or HTTPS");
  }
  if (url.username || url.password) {
    throw new Error("Target URL must not contain credentials");
  }

  const addresses = await resolveHost(url.hostname);
  if (addresses.length === 0) {
    throw new Error("Target host did not resolve");
  }
  if (!addresses.every(isPublicAddress)) {
    throw new Error("Target host must resolve only to public IP addresses");
  }
  return url;
}
