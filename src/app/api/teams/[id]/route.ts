// Imports

import { NextRequest, NextResponse } from "next/server";
import { getTeamById, updateTeam, deleteTeam } from "@/lib/service/team.service";
import { apiHandler, handleCloseDatabaseConnections } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { updateTeamSchema, teamIdParamSchema, validateRequestBody, validateRouteParams } from "@/lib/core/zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";
import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { verifyAccountPermission } from "@/lib/core/validation";
import { getRowById } from "@/lib/core/database/queries";

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
        const paramValidationResult = await validateRouteParams(teamIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const teamId = paramValidationResult.data.id;

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

        const getTeamResult = await getTeamById(userId, accountId, teamId);
        if(!getTeamResult.status || !getTeamResult.data) {
            return {
                status: false,
                data: null,
                message: getTeamResult.message
            };
        }

        return {
            status: true,
            data: getTeamResult.data,
            message: getTeamResult.message
        };

    }, 'GET /api/teams/[id]', 200, 400);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<DataReturnObject<boolean>>> {
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
        const paramValidationResult = await validateRouteParams(teamIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const teamId = paramValidationResult.data.id;

        const body = await request.json();

        const validationResult = await validateRequestBody(updateTeamSchema, body);
        if(!validationResult.status || !validationResult.data) {
            return {
                status: false,
                data: null,
                message: validationResult.message
            };
        }

        const { name, description } = validationResult.data;

        const { searchParams } = new URL(request.url);
        const accountIdParam = searchParams.get('accountId');
        
        let accountId: number | null = null;
        
        if(accountIdParam) {
            accountId = parseInt(accountIdParam);
            if(isNaN(accountId) || accountId <= 0) {
                return {
                    status: false,
                    data: null,
                    message: 'Invalid account ID'
                };
            }
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

            if(!accountId) {
                const teamResult = await getRowById(dbClient, 'team', teamId);
                if(!teamResult.status || !teamResult.data) {
                    return {
                        status: false,
                        data: null,
                        message: 'Team not found'
                    };
                }
                accountId = teamResult.data.account_id as number;
            }

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'team.update');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to update teams'
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

        const updateTeamResult = await updateTeam(userId, accountId!, teamId, name, description);
        if(!updateTeamResult.status || !updateTeamResult.data) {
            return {
                status: false,
                data: null,
                message: updateTeamResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Team updated successfully'
        };

    }, 'PUT /api/teams/[id]', 200, 400);
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

        const paramValidationResult = await validateRouteParams(teamIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const teamId = paramValidationResult.data.id;

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

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'team.delete');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to delete teams'
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

        const deleteTeamResult = await deleteTeam(userId, accountId, teamId);
        if(!deleteTeamResult.status || !deleteTeamResult.data) {
            return {
                status: false,
                data: null,
                message: deleteTeamResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Team deleted successfully'
        };

    }, 'DELETE /api/teams/[id]', 200, 400);
}

