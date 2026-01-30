// Imports

import { NextRequest, NextResponse } from "next/server";
import { getAllTeams, createTeam } from "@/lib/service/team.service";
import { apiHandler, handleCloseDatabaseConnections } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { verifyAccountPermission } from "@/lib/core/validation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";
import { createTeamSchema, validateRequestBody } from "@/lib/core/zod";

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

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'team.view');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to view teams'
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

        const getAllTeamsResult = await getAllTeams(userId, accountId);
        if(!getAllTeamsResult.status || !getAllTeamsResult.data) {
            return {
                status: false,
                data: null,
                message: getAllTeamsResult.message
            };
        }

        return {
            status: true,
            data: getAllTeamsResult.data,
            message: getAllTeamsResult.message
        };

    }, 'GET /api/teams', 200, 400);
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

        const validationResult = await validateRequestBody(createTeamSchema, body);
        if(!validationResult.status || !validationResult.data) {
            return {
                status: false,
                data: null,
                message: validationResult.message
            };
        }

        const { name, description, accountId } = validationResult.data;

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

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'team.create');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to create teams'
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

        const createTeamResult = await createTeam(userId, accountId, name, description);
        if(!createTeamResult.status || !createTeamResult.data) {
            return {
                status: false,
                data: null,
                message: createTeamResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Team created successfully'
        };

    }, 'POST /api/teams', 201, 400);
}

