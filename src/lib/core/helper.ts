// Imports

import { DatabaseClient } from "./database";
import { closeDatabaseConnection } from "./database";
import { sensitiveFieldPatterns } from "@/utils/constants";
import { DataReturnObject } from "@/types/helper";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

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
            closeDatabaseConnection(temporaryDbClient).then(() => {}).catch(() => {})
        );
    }

    if (dbClient) {
        closePromises.push(
            closeDatabaseConnection(dbClient).then(() => {}).catch(() => {})
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

export async function generatePassword(retryCount: number = 0): Promise<DataReturnObject<string>> {
    const maxRetries = 5;
    
    try {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const allChars = uppercase + lowercase + numbers + special;
        const minLength = 16;
        const maxLength = 24;
        const lengthRange = maxLength - minLength + 1;
        const lengthOffset = randomBytes(1)[0] % lengthRange;
        const targetLength = minLength + lengthOffset;

        const requiredChars = [
            uppercase[randomBytes(1)[0] % uppercase.length],
            lowercase[randomBytes(1)[0] % lowercase.length],
            numbers[randomBytes(1)[0] % numbers.length],
            special[randomBytes(1)[0] % special.length]
        ];

        const remainingLength = targetLength - requiredChars.length;
        const randomChars: string[] = [];
        
        for (let i = 0; i < remainingLength; i++) {
            const randomIndex = randomBytes(1)[0] % allChars.length;
            randomChars.push(allChars[randomIndex]);
        }

        const allPasswordChars = [...requiredChars, ...randomChars];

        for (let i = allPasswordChars.length - 1; i > 0; i--) {
            const j = randomBytes(1)[0] % (i + 1);
            [allPasswordChars[i], allPasswordChars[j]] = [allPasswordChars[j], allPasswordChars[i]];
        }

        const password = allPasswordChars.join('');

        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

        if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial || password.length < minLength) {
            if (retryCount < maxRetries) {
                return generatePassword(retryCount + 1);
            } else {
                return {
                    status: false,
                    data: null,
                    message: 'Failed to generate password meeting complexity requirements after multiple attempts'
                };
            }
        }

        return {
            status: true,
            data: password,
            message: 'Password generated successfully'
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while generating password'
        };
    }
}

function determineErrorStatus(message: string, defaultStatus: number): number {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('required') || 
        lowerMessage.includes('invalid') || 
        lowerMessage.includes('validation')) {
        return 400;
    }
    
    if (lowerMessage.includes('not found') || 
        lowerMessage.includes('does not exist')) {
        return 404;
    }
    
    if (lowerMessage.includes('unauthorized') || 
        lowerMessage.includes('permission') ||
        lowerMessage.includes('access denied')) {
        return 403;
    }
    
    if (lowerMessage.includes('database') || 
        lowerMessage.includes('server') ||
        lowerMessage.includes('internal')) {
        return 500;
    }
    
    return defaultStatus;
}

export function handleApiResponse<T>(
    result: DataReturnObject<T>,
    successStatus: number = 200,
    errorStatus: number = 400
): NextResponse<DataReturnObject<T>> {
    if (result.status) {
        return NextResponse.json(result, { status: successStatus });
    } else {
        const status = determineErrorStatus(result.message, errorStatus);
        return NextResponse.json(result, { status });
    }
}

export async function apiHandler<T>(
    handler: () => Promise<DataReturnObject<T>>,
    context: string,
    successStatus: number = 200,
    errorStatus: number = 400
): Promise<NextResponse<DataReturnObject<T>>> {
    try {
        const result = await handler();
        return handleApiResponse(result, successStatus, errorStatus);
    } catch (error: unknown) {
        logger.error(context, error);
        
        const errorResult: DataReturnObject<T> = {
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error',
            data: null
        };
        
        return handleApiResponse(errorResult, 200, 500);
    }
}

export async function formatDate(date: Date | string): Promise<string> {
    try{
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    } catch(error: unknown) {
        return error instanceof Error ? error.message : 'Unknown error while formatting date';
    }
};

