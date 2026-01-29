// Imports

import { NextRequest, NextResponse } from "next/server";
import { deleteUser } from "@/lib/service/user.service";
import { apiHandler, handleCloseDatabaseConnections } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { userAccountIdParamSchema, validateRouteParams } from "@/lib/core/zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";
import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { verifyAccountPermission } from "@/lib/core/validation";

// Exports

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

        const paramValidationResult = await validateRouteParams(userAccountIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const userAccountId = paramValidationResult.data.id;

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

        let dbClient: DatabaseClient | null = null;

        try {
            const databaseConnection = await connectToDatabase(false);
            if(!databaseConnection.status || !databaseConnection.data) {
                return {
                    status: false,
                    data: null,
                    message: databaseConnection.message
                };
            }
            
            dbClient = databaseConnection.data;

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'user.delete');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to delete users'
                };
            }

        } catch(error: unknown) {
            return {
                status: false,
                data: null,
                message: 'Failed to verify permissions'
            };
        } finally {
            await handleCloseDatabaseConnections(null, dbClient);
        }

        const deleteUserResult = await deleteUser(userId, accountId, userAccountId);
        if(!deleteUserResult.status || !deleteUserResult.data) {
            return {
                status: false,
                data: null,
                message: deleteUserResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'User access removed successfully'
        };

    }, 'DELETE /api/users/[id]', 200, 400);
}

