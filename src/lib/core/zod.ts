// Imports

import { z } from 'zod';
import { DataReturnObject } from '@/types/helper';

// Export functions

export async function validateRequestBody<T extends z.ZodTypeAny>(schema: T, data: unknown): Promise<DataReturnObject<z.infer<T>>> {
    try {
        const validatedData = schema.parse(data);
        return {
            status: true,
            data: validatedData,
            message: 'Validation successful'
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.issues.map(err => {
                const path = err.path.join('.');
                return path ? `${path}: ${err.message}` : err.message;
            });
            
            return {
                status: false,
                data: null,
                message: errorMessages.join('; ')
            };
        }
        
        return {
            status: false,
            data: null,
            message: 'Validation failed'
        };
    }
}

export async function validateRouteParams<T extends z.ZodTypeAny>(schema: T, params: unknown): Promise<DataReturnObject<z.infer<T>>> {
    try {
        const validatedParams = schema.parse(params);
        return {
            status: true,
            data: validatedParams,
            message: 'Validation successful'
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.issues.map(err => {
                const path = err.path.join('.');
                return path ? `${path}: ${err.message}` : err.message;
            });
            
            return {
                status: false,
                data: null,
                message: errorMessages.join('; ')
            };
        }
        
        return {
            status: false,
            data: null,
            message: 'Parameter validation failed'
        };
    }
}

// Exports

export const createUserAccountSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const userIdParamSchema = z.object({
    id: z.coerce.number().int().positive('User ID must be a positive integer'),
});

export const createAccountSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().min(1, 'Description is required').max(255),
});

export const reportIssueSchema = z.object({
    issueType: z.string().min(1, 'Issue type is required'),
    issueDescription: z.string().min(1, 'Issue description is required'),
});

