// Imports

import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import { RateLimitResult, RateLimitOptions, RateLimitChecker } from "@/types/rateLimit";
import { DataReturnObject } from "@/types/helper";
import { logger } from "./helper";

// Load Environment Variables

dotenv.config();

// Environment Variables

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPassword = process.env.REDIS_PASSWORD;
const isProduction = process.env.NODE_ENV === 'production';

// Validate environment variables at startup

if(!redisUrl || redisUrl === '') {
    throw new Error("REDIS_URL is not set");
}

if (isProduction && !redisPassword) {
    throw new Error(
        "REDIS_PASSWORD is required in production environment. " +
        "Set REDIS_PASSWORD environment variable to secure your Redis instance."
    );
}

// Variables

let redisClient: RedisClientType | null = null;

// Functions

async function getRedisClient(): Promise<DataReturnObject<RedisClientType>> {
    try{
        if (redisClient && redisClient.isOpen) {
            return {
                status: true,
                data: redisClient,
                message: 'Redis Client Connected'
            };
        }
    
        const clientConfig: { url: string; password?: string } = {
            url: redisUrl,
        };
        
        if (redisPassword) {
            clientConfig.password = redisPassword;
        }
        
        redisClient = createClient(clientConfig);
    
        redisClient.on('error', (err) => {
            logger.error('RedisClient', err);
        });
    
        redisClient.on('connect', () => {
            logger.info('RedisClient', 'Connected');
        });
    
        await redisClient.connect();
        return {
            status: true,
            data: redisClient,
            message: 'Redis Client Connected'
        };
    } catch (error: unknown) {
        logger.error('getRedisClient', error);
        return {
            status: false,
            data: null,
            message: 'Failed to connect to Redis'
        };
    }
}

async function closeRedisConnection(): Promise<DataReturnObject<boolean>> {
    try{
        if (redisClient && redisClient.isOpen) {
            await redisClient.quit();
            redisClient = null;
        }
        return {
            status: true,
            data: true,
            message: 'Redis Client Closed'
        };
    } catch (error: unknown) {
        logger.error('closeRedisConnection', error);
        return {
            status: false,
            data: false,
            message: 'Failed to close Redis connection'
        };
    }
}

// Exports

export function rateLimit(options: RateLimitOptions): RateLimitChecker {
    return {
        check: async (limit: number, token: string): Promise<RateLimitResult> => {
            try {

                const client = await getRedisClient();
                if (!client.status || !client.data) {
                    logger.warning('RateLimit', 'Redis unavailable, denying request (fail-closed)');
                    return {
                        success: false,
                        limit,
                        remaining: 0,
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
                    success: false,
                    limit,
                    remaining: 0,
                    reset: Date.now() + options.interval,
                };
            }
        },
    };
}

export const authLimiter = rateLimit({
    interval: 60 * 1000,
});

export const generalLimiter = rateLimit({
    interval: 60 * 1000,
});

export const strictLimiter = rateLimit({
    interval: 60 * 1000,
});