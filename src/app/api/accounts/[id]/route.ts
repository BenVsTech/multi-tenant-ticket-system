// Imports

import { NextRequest, NextResponse } from "next/server";
import { getAccountById, updateAccount, deleteAccount } from "@/lib/service/account.service";
import { apiHandler } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { updateAccountSchema, accountIdParamSchema, validateRequestBody, validateRouteParams } from "@/lib/core/zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";

// Exports

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<DataReturnObject<{name: string, description: string}>>> {
    return apiHandler<{name: string, description: string}>(async () => {

        const session = await getServerSession(authOptions);
        if(!session?.user?.id) {
            return {
                status: false,
                data: null,
                message: 'Unauthorized'
            };
        }

        const userId = parseInt(session.user.id);

        const resolvedParams = await params;

        const paramValidationResult = await validateRouteParams(accountIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const accountId = paramValidationResult.data.id;

        const getAccountResult = await getAccountById(userId, accountId);
        if(!getAccountResult.status || !getAccountResult.data) {
            return {
                status: false,
                data: null,
                message: getAccountResult.message
            };
        }

        return {
            status: true,
            data: getAccountResult.data,
            message: getAccountResult.message
        };

    }, 'GET /api/accounts/[id]', 200, 400);
}

export async function PUT(request: NextRequest,{ params }: { params: Promise<{ id: string }> }): Promise<NextResponse<DataReturnObject<boolean>>> {
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

        const resolvedParams = await params;
        const paramValidationResult = await validateRouteParams(accountIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const accountId = paramValidationResult.data.id;

        const body = await request.json();

        const validationResult = await validateRequestBody(updateAccountSchema, body);
        if(!validationResult.status || !validationResult.data) {
            return {
                status: false,
                data: null,
                message: validationResult.message
            };
        }

        const { name, description } = validationResult.data;

        const updateAccountResult = await updateAccount(accountId, { name, description });
        if(!updateAccountResult.status || !updateAccountResult.data) {
            return {
                status: false,
                data: null,
                message: updateAccountResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Account updated successfully'
        };

    }, 'PUT /api/accounts/[id]', 200, 400);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<DataReturnObject<boolean>>> {
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

        const resolvedParams = await params;
        const paramValidationResult = await validateRouteParams(accountIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const accountId = paramValidationResult.data.id;

        const deleteAccountResult = await deleteAccount(accountId);
        if(!deleteAccountResult.status || !deleteAccountResult.data) {
            return {
                status: false,
                data: null,
                message: deleteAccountResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Account deleted successfully'
        };

    }, 'DELETE /api/accounts/[id]', 200, 400);
}

