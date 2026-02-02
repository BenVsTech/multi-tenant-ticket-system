// Imports

import { NextRequest, NextResponse } from "next/server";
import { getUsersForOptions } from "@/lib/service/user.service";
import { apiHandler, handleCloseDatabaseConnections } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { verifyAccountPermission } from "@/lib/core/validation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";

// Exports

export async function GET(request: NextRequest): Promise<NextResponse<DataReturnObject<{id: number, name: string}[]>>> {
    return apiHandler<{id: number, name: string}[]>(async () => {

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

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'user.view');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to view users'
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

        const getUsersForOptionsResult = await getUsersForOptions(userId, accountId);
        if(!getUsersForOptionsResult.status || !getUsersForOptionsResult.data) {
            return {
                status: false,
                data: null,
                message: getUsersForOptionsResult.message
            };
        }

        return {
            status: true,
            data: getUsersForOptionsResult.data,
            message: getUsersForOptionsResult.message
        };

    }, 'GET /api/users/options', 200, 400);
}

