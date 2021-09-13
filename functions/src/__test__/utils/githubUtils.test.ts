
describe("isIpInCIDR", () => {
  test("[IPv4] it should return true if ip is in CIDR block", () => {
    expect(false).toBe(true);
  });
  test("[IPv6] it should return true if ip is in CIDR block", () => {
    expect(false).toBe(true);
  });
  test("[IPv4] it should return false if ip is not in CIDR block", () => {
    expect(false).toBe(true);
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

