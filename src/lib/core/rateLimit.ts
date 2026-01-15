// Imports

import { RateLimitStore, RateLimitResult, RateLimitOptions, RateLimitChecker } from "@/types/rateLimit";

// Variables

const rateLimitStore: RateLimitStore = {};

// Exports

export function rateLimit(options: RateLimitOptions): RateLimitChecker {
    return {
        check: (limit: number, token: string): RateLimitResult => {
            const now = Date.now();
            Object.keys(rateLimitStore).forEach((key) => {
                if (rateLimitStore[key].resetTime < now) {
                    delete rateLimitStore[key];
                }
            });

            if (!rateLimitStore[token]) {
                rateLimitStore[token] = {
                    count: 0,
                    resetTime: now + options.interval,
                };
            }

            const record = rateLimitStore[token];

            if (record.resetTime < now) {
                record.count = 0;
                record.resetTime = now + options.interval;
            }

            if (record.count >= limit) {
                return {
                    success: false,
                    limit,
                    remaining: 0,
                    reset: record.resetTime,
                };
            }

            record.count += 1;

            return {
                success: true,
                limit,
                remaining: limit - record.count,
                reset: record.resetTime,
            };
        },
    };
}

export const authLimiter = rateLimit({
    interval: 60 * 1000,
});

