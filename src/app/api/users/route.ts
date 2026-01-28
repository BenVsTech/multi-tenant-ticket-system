// Imports

import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, createUser } from "@/lib/service/user.service";
import { apiHandler } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { createUserSchema, validateRequestBody } from "@/lib/core/zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";

// Exports

export async function GET(request: NextRequest): Promise<NextResponse<DataReturnObject<string[][]>>> {
    return apiHandler<string[][]>(async () => {

        const session = await getServerSession(authOptions);
        if(!session?.user?.id) {
            return {
                status: false,
                data: null,
                message: 'Unauthorized'
            };
        }

        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const accountIdParam = searchParams.get('accountId');
        
        if(!accountIdParam) {
            return {
                status: false,
                data: null,
                message: 'Account ID is required'
            };
        }

        const accountId = parseInt(accountIdParam);
        if(isNaN(accountId) || accountId <= 0) {
            return {
                status: false,
                data: null,
                message: 'Invalid account ID'
            };
        }

        const getAllUsersResult = await getAllUsers(userId, accountId);
        if(!getAllUsersResult.status || !getAllUsersResult.data) {
            return {
                status: false,
                data: null,
                message: getAllUsersResult.message
            };
        }

        return {
            status: true,
            data: getAllUsersResult.data,
            message: getAllUsersResult.message
        };

    }, 'GET /api/users', 200, 400);
}

export async function POST(request: Request): Promise<NextResponse<DataReturnObject<boolean>>> {
    return apiHandler<boolean>(async () => {

        const session = await getServerSession(authOptions);
        if(!session?.user?.id) {
            return {
                status: false,
                data: null,
                message: 'Unauthorized'
            };
        }

        const userId = parseInt(session.user.id);

        const body = await request.json();

        const validationResult = await validateRequestBody(createUserSchema, body);
        if(!validationResult.status || !validationResult.data) {
            return {
                status: false,
                data: null,
                message: validationResult.message
            };
        }

        const { name, email, role_id, accountId } = validationResult.data;

        const createUserResult = await createUser(userId, accountId, name, email, role_id);
        if(!createUserResult.status || !createUserResult.data) {
            return {
                status: false,
                data: null,
                message: createUserResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'User created successfully'
        };

    }, 'POST /api/users', 201, 400);
}

