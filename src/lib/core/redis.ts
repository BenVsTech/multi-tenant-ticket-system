// Imports 

import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import { DataReturnObject } from '@/types/helper';
import { logger } from './helper';

// Load Environment Variables

dotenv.config();

// Environment Variables

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPassword = process.env.REDIS_PASSWORD;

if(!redisUrl) {
    throw new Error("REDIS_URL is not set");
}

// Variables

let redisClient: RedisClientType | null = null;

// Exports

export async function getRedisClient(): Promise<DataReturnObject<RedisClientType>> {
    try{
        if (redisClient && redisClient.isOpen) {
            return {
                status: true,
                data: redisClient,
                message: 'Redis Client Connected'
            };
        }
    
        redisClient = createClient({
            url: redisUrl,
            ...(redisPassword && { password: redisPassword }),
        });
    
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

export async function closeRedisConnection(): Promise<DataReturnObject<boolean>> {
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

