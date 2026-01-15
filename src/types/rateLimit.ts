// Exports

export interface RateLimitStore {
    [key: string]: {
      count: number;
      resetTime: number;
    };
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

export interface RateLimitOptions {
    interval: number;
}

export interface RateLimitChecker {
    check: (limit: number, token: string) => RateLimitResult;
}

