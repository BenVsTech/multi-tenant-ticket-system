// Imports

import { RateLimitResult, RateLimitOptions, RateLimitChecker } from "@/types/rateLimit";
import { getRedisClient } from "./redis";
import { logger } from "./helper";

// Exports

export function rateLimit(options: RateLimitOptions): RateLimitChecker {
    return {
        check: async (limit: number, token: string): Promise<RateLimitResult> => {
            try {

                const client = await getRedisClient();
                if (!client.status || !client.data) {
                    logger.warning('RateLimit', 'Redis unavailable, allowing request');
                    return {
                        success: true,
                        limit,
                        remaining: limit - 1,
                        reset: Date.now() + options.interval,
                    };
                }

                const now = Date.now();
                const key = `ratelimit:${token}`;
                
                const data = await client.data.get(key);
                
                let count = 0;
                let resetTime = now + options.interval;
                
                if (data) {
                    const parsed = JSON.parse(data);
                    count = parsed.count;
                    resetTime = parsed.resetTime;
                    
                    if (resetTime < now) {
                        count = 0;
                        resetTime = now + options.interval;
                    }
                }
                
                if (count >= limit) {
                    return {
                        success: false,
                        limit,
                        remaining: 0,
                        reset: resetTime,
                    };
                }
                
                count += 1;
                
                const ttl = Math.ceil((resetTime - now) / 1000);
                
                await client.data.setEx(
                    key,
                    ttl,
                    JSON.stringify({ count, resetTime })
                );
                
                return {
                    success: true,
                    limit,
                    remaining: limit - count,
                    reset: resetTime,
                };
            } catch (error) {
                logger.error('RateLimit', error);
                return {
                    success: true,
                    limit,
                    remaining: limit - 1,
                    reset: Date.now() + options.interval,
                };
            }
        },
    };
}

export const authLimiter = rateLimit({
    interval: 60 * 1000,
});