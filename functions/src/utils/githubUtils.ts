const IPv4RegExp: RegExp = /(([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-2])\.){3}([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-2])/gi
const IPv4CIDRRegExp: RegExp = /(([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-2])\.){3}([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-2])(\/([1-2][0-9]|3[0-2]|[0-9]))/gi

const IPv6RegExp: RegExp = /(([0-9a-fA-f]){0,4}:){7}([0-9a-fA-f]){0,4}/gi
const IPv6CIDRRegExp: RegExp = /(([0-9a-fA-f]){0,4}:){1,7}([0-9a-fA-f]){0,4}(\/(12[0-8]|1[0-1][0-9]|[0-9]{1,2}))/gi

/**
 * Made with the help of code from Edd Mann
 * https://github.com/eddmann
 * https://tech.mybuilder.com/determining-if-an-ipv4-address-is-within-a-cidr-range-in-javascript/
 */
function ip4ToInt(ip: string): number {
  return ip.split('.').reduce((int: number, oct: string) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

/**
 * Made with the help of code from Edd Mann
 * https://github.com/eddmann
 * https://tech.mybuilder.com/determining-if-an-ipv4-address-is-within-a-cidr-range-in-javascript/
 */
export function isIpInCIDR(ip: string, cidr: string): boolean {
  const IPv4Match = ip.match(IPv4RegExp);
  const IPv4CIDRMatch = cidr.match(IPv4CIDRRegExp);
  const IPv6Match = ip.match(IPv6RegExp);
  const IPv6CIDRMatch = cidr.match(IPv6CIDRRegExp);
  if ((IPv4Match === null || IPv4Match[0] !== ip
    || IPv4CIDRMatch === null || IPv4CIDRMatch[0] !== cidr)
    && (IPv6Match === null || IPv6Match[0] !== ip
      || IPv6CIDRMatch === null || IPv6CIDRMatch[0] !== cidr)) {
    return false;
  }

  const [range, sbits = '32'] = cidr.split('/');
  const bits = parseInt(sbits, 10);
  const mask = ~(2 ** (32 - bits) - 1);
  return (ip4ToInt(ip) & mask) === (ip4ToInt(range) & mask);

}

