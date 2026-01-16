// Imports

import { DatabaseClient } from "./database";
import { closeDatabaseConnection } from "./database";

// Exports

export async function handleCloseDatabaseConnections(temporaryDbClient: DatabaseClient | null, dbClient: DatabaseClient | null): Promise<void> {
    const closePromises: Promise<void>[] = [];

    if (temporaryDbClient) {
        closePromises.push(
            closeDatabaseConnection(temporaryDbClient).then(() => {})
        );
    }

    if (dbClient) {
        closePromises.push(
            closeDatabaseConnection(dbClient).then(() => {})
        );
    }

    await Promise.all(closePromises);
}

function logError(context: string, error: unknown, sensitiveData?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
        if (sensitiveData) {
            console.error(`[${context}]`, error, sensitiveData);
        } else {
            console.error(`[${context}]`, error);
        }
    } else {
        const errorId = Math.random().toString(36).substring(7);
        console.error(`[${context}] Error ID: ${errorId}`);
    }
}

function logWarning(context: string, message: string, sensitiveData?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
        if (sensitiveData) {
            console.warn(`[${context}] ${message}`, sensitiveData);
        } else {
            console.warn(`[${context}] ${message}`);
        }
    } else {
        console.warn(`[${context}] ${message}`);
    }
}

function logInfo(context: string, message: string): void {
    console.log(`[${context}] ${message}`);
}

export const logger = {
    error: logError,
    warning: logWarning,
    info: logInfo,
};

