// Imports

import { DatabaseClient } from "./database";
import { closeDatabaseConnection } from "./database";
import { sensitiveFieldPatterns } from "@/utils/constants";

// Functions

function isSensitiveField(key: string): boolean {
    return sensitiveFieldPatterns.some(pattern => pattern.test(key));
}

function sanitizeValue(value: any, depth: number = 0): any {
    if (depth > 5) {
        return '[Max Depth Reached]';
    }

    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item, depth + 1));
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack ? sanitizeStackTrace(value.stack) : undefined,
        };
    }

    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
        if (isSensitiveField(key)) {
            sanitized[key] = '[REDACTED]';
        } else {
            sanitized[key] = sanitizeValue(val, depth + 1);
        }
    }

    return sanitized;
}

function sanitizeStackTrace(stack: string): string {
    return stack
        .split('\n')
        .map(line => {
            if (line.includes('at ') || line.includes('    at ')) {
                const match = line.match(/(.*?at\s+)(.+?)(:\d+:\d+)/);
                if (match) {
                    const [, prefix, path, location] = match;
                    const filename = path.split(/[/\\]/).pop() || path;
                    return `${prefix}${filename}${location}`;
                }
            }
            return line;
        })
        .join('\n');
}

function sanitizeError(error: unknown): any {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack ? sanitizeStackTrace(error.stack) : undefined,
        };
    }

    if (typeof error === 'object' && error !== null) {
        return sanitizeValue(error);
    }

    return error;
}

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
        const sanitizedError = sanitizeError(error);
        if (sensitiveData) {
            const sanitizedData = sanitizeValue(sensitiveData);
            console.error(`[${context}]`, sanitizedError, sanitizedData);
        } else {
            console.error(`[${context}]`, sanitizedError);
        }
    } else {
        const errorId = Math.random().toString(36).substring(7);
        console.error(`[${context}] Error ID: ${errorId}`);
    }
}

function logWarning(context: string, message: string, sensitiveData?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
        if (sensitiveData) {
            const sanitizedData = sanitizeValue(sensitiveData);
            console.warn(`[${context}] ${message}`, sanitizedData);
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

