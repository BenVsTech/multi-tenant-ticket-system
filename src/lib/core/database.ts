// Imports

import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";
import { DataReturnObject } from "@/types/helper";
import { logger } from "./helper";

// Load Environment Variables

dotenv.config();

const host = process.env.DB_HOST;
const portStr = process.env.DB_PORT || "5432";
const port = parseInt(portStr, 10);
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DATABASE;

// Validate environment variables with specific error messages

const missingVars: string[] = [];
if (!host) missingVars.push("DB_HOST");
if (!port || isNaN(port)) missingVars.push("DB_PORT (must be a valid number)");
if (!user) missingVars.push("DB_USER");
if (!password) missingVars.push("DB_PASSWORD");
if (!database) missingVars.push("DATABASE");

if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
}

let mainPool: Pool | null = null;
let tempPool: Pool | null = null;

// Exports Types

export type DatabaseClient = PoolClient;

// Exports Functions

function getPool(temporary: boolean): Pool {
    if (temporary) {
        if (!tempPool) {
            tempPool = new Pool({
                user: user!,
                host: host!,
                database: 'postgres',
                password: password!,
                port: port,
                max: 50,
                idleTimeoutMillis: 10000,
                connectionTimeoutMillis: 2000,
                maxUses: 1000,
                application_name: "internal-ticket-system",
            });

            tempPool.on('error', (err) => {
                logger.error('DatabasePool-Temporary', err);
            });
        }
        return tempPool;
    } else {
        if (!mainPool) {
            mainPool = new Pool({
                user: user!,
                host: host!,
                database: database!,
                password: password!,
                port: port,
                max: 50,
                idleTimeoutMillis: 10000,
                connectionTimeoutMillis: 2000,
                maxUses: 1000,
                application_name: "internal-ticket-system",
            });

            mainPool.on('error', (err) => {
                logger.error('DatabasePool-Main', err);
            });
        }
        return mainPool;
    }
}

// Exports Functions

export async function connectToDatabase(temporary: boolean = false): Promise<DataReturnObject<DatabaseClient>> {
    try {
        const pool = getPool(temporary);
        const client = await pool.connect();

        return {
            status: true,
            data: client,
            message: "Connected to database"
        };
    } catch (error: unknown) {
        logger.error('DatabaseConnection', error);
        return {
            status: false,
            data: null,
            message: "Failed to connect to database"
        };
    }
}

export async function closeDatabaseConnection(client: DatabaseClient): Promise<DataReturnObject<void>> {
    try {
        client.release();
        
        return {
            status: true,
            data: null,
            message: "Closed database connection"
        };
    } catch (error: unknown) {
        logger.error('DatabaseConnectionClose', error);
        return {
            status: false,
            data: null,
            message: "Failed to close database connection"
        };
    }
}

export async function closeAllPools(): Promise<DataReturnObject<void>> {
    const pools: Promise<void>[] = [];
    
    if (mainPool) {
        pools.push(mainPool.end());
        mainPool = null;
    }
    
    if (tempPool) {
        pools.push(tempPool.end());
        tempPool = null;
    }
    
    await Promise.all(pools);

    return {
        status: true,
        data: null,
        message: "Closed all pools"
    };
}

