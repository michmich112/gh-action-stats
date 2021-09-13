import { isIpInCIDR } from "../../utils/githubUtils";

describe("isIpInCIDR", () => {
  test("[IPv4] it should return true if ip is in CIDR block", () => {
    expect(isIpInCIDR("192.168.0.1", "192.168.0.0/31")).toBe(true);
    expect(isIpInCIDR("192.168.0.0", "192.168.0.0/31")).toBe(true);
    expect(isIpInCIDR("192.168.0.0", "192.168.0.0/24")).toBe(true);
    expect(isIpInCIDR("192.168.0.0", "192.168.0.0/16")).toBe(true);
    expect(isIpInCIDR("192.168.0.0", "192.168.0.0/8")).toBe(true);
    expect(isIpInCIDR("1.2.3.4", "0.0.0.0/0")).toBe(true);
    expect(isIpInCIDR("1.2.3.4", "1.2.3.4/32")).toBe(true);
  });

  test("[IPv4] it should return false if an incorrect IPv4 CIDR block is passed", () => {
    expect(isIpInCIDR("1.2.3.4", "1.2.3.4/33")).toBe(false);
    expect(isIpInCIDR("252.252.252.252", "253.0.0.0/8")).toBe(false);
  });

  test("[IPv4] it should return false if ip is not in CIDR block", () => {
    const ip1 = "192.168.0.2";
    const ip2 = "192.168.1.1";
    const cidr = "192.168.0.0/31";
    expect(isIpInCIDR(ip1, cidr)).toBe(false);
    expect(isIpInCIDR(ip2, cidr)).toBe(false);
  });

  test("[IPv6] it should return true if ip is in CIDR block", () => {
    const cidr = "2603:1030:401:160::/61";
    expect(isIpInCIDR("2603:1030:401:160:1:1:1:1", cidr)).toBe(true);
    expect(isIpInCIDR("2603:1030:401:160:1111:1111:1111:1111", cidr)).toBe(true);
    expect(isIpInCIDR("1111:2222:3333:4444:5555:6666:7777:8888", "1111:2222:3333:4444:5555:6666:7777:8888/128")).toBe(true);
    expect(isIpInCIDR("1:2:3:4:5:6:7:8", "::/0")).toBe(true);
  });

  test("[IPv6] it should return false if an incorrect IPv6 CIDR block is passed", () => {
    expect(isIpInCIDR("1:2:3:4:5:6:7:8", "2603:1030:401:160::/129")).toBe(false);
    //expect(isIpInCIDR("1:2:3:4:5:6:7:8", ":/0")).toBe(false);
  });

  test("[IPv6] it should return false if ip is not in CIDR block", () => {
    expect(false).toBe(true);
  });

  test("it should return false if comparing a IPv4 Address to an IPv6 CIDR block", () => {
    expect(false).toBe(true);
  });

  test("it should return false if comparing a IPv6 Address to an IPv4 CIDR block", () => {
    expect(false).toBe(true);
  });
})

describe("isGithubActionsAddress", () => {
  // TODO: mock api call
  test("it sohuld return true if it is in one of the github actions cidr block", () => {
    expect(false).toBe(true);
  });
})

