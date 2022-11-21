import { AxiosResponse } from "axios";

type RateLimitHeaders = {
  [header: string]: {
    header: string;
    type: string;
    default: () => string | number | Date;
    cast: (value: any) => string | number | Date;
    key: keyof GithubApiRateLimit;
  };
};

const GithubApiRateLimitHeaders: RateLimitHeaders = {
  "x-ratelimit-limit": {
    header: "x-ratelimit-limit",
    type: "number",
    default: () => 5000,
    cast: (v: any) => parseInt(v),
    key: "limit",
  },
  "x-ratelimit-remaining": {
    header: "x-ratelimit-remaining",
    type: "number",
    default: () => 1000,
    cast: (v: any) => parseInt(v),
    key: "remaining",
  },
  "x-ratelimit-reset": {
    header: "x-ratelimit-reset",
    type: "Date",
    default: () => new Date(new Date().getTime() + 3600000),
    cast: (v: any) => new Date(v),
    key: "reset",
  },
};

export type GithubApiRateLimit = {
  limit: number;
  remaining: number;
  reset: Date;
};

export function getDefaultRateLimit(): GithubApiRateLimit {
  return Object.values(GithubApiRateLimitHeaders).reduce(
    (acc, cur) => ({
      ...acc,
      [cur.key]: cur.default(),
    }),
    {}
  ) as GithubApiRateLimit;
}

export function getRateLimitFromResponse(
  res: AxiosResponse
): GithubApiRateLimit {
  const requiredHeaders = Object.keys(GithubApiRateLimitHeaders);

  const allHeadersPresent =
    requiredHeaders.filter((rh) => Object.keys(res.headers).includes(rh))
      .length === requiredHeaders.length;

  if (!allHeadersPresent) {
    console.warn(
      `[GithubApi][getRateLimitFromResponse] - Not all rate limit headers are present, using defaults.`
    );
  }

  return Object.values(GithubApiRateLimitHeaders).reduce(
    (acc, cur) => ({
      ...acc,
      [cur.key]: res.headers[cur.header]
        ? cur.cast(res.headers[cur.header])
        : cur.default(),
    }),
    {}
  ) as GithubApiRateLimit;
}
