// Imports

import { NextRequest, NextResponse } from "next/server";
import { getTicketById, updateTicket, deleteTicket } from "@/lib/service/ticket.service";
import { apiHandler, handleCloseDatabaseConnections } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { updateTicketSchema, ticketIdParamSchema, validateRequestBody, validateRouteParams } from "@/lib/core/zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";
import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { verifyAccountPermission } from "@/lib/core/validation";
import { getRowById } from "@/lib/core/database/queries";

// Exports

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<DataReturnObject<{title: string, description: string, status: string, assigned_to_team_id: number, assigned_to_user_id: number | null}>>> {
    return apiHandler<{title: string, description: string, status: string, assigned_to_team_id: number, assigned_to_user_id: number | null}>(async () => {

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
        const paramValidationResult = await validateRouteParams(ticketIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const ticketId = paramValidationResult.data.id;

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

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'ticket.view');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to view tickets'
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

        const getTicketResult = await getTicketById(userId, accountId, ticketId);
        if(!getTicketResult.status || !getTicketResult.data) {
            return {
                status: false,
                data: null,
                message: getTicketResult.message
            };
        }

        return {
            status: true,
            data: getTicketResult.data,
            message: getTicketResult.message
        };

    }, 'GET /api/tickets/[id]', 200, 400);
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
        const paramValidationResult = await validateRouteParams(ticketIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const ticketId = paramValidationResult.data.id;

        const body = await request.json();

        const validationResult = await validateRequestBody(updateTicketSchema, body);
        if(!validationResult.status || !validationResult.data) {
            return {
                status: false,
                data: null,
                message: validationResult.message
            };
        }

        const { title, description, status, assigned_to_team_id, assigned_to_user_id } = validationResult.data;

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
                const ticketResult = await getRowById(dbClient, 'ticket', ticketId);
                if(!ticketResult.status || !ticketResult.data) {
                    return {
                        status: false,
                        data: null,
                        message: 'Ticket not found'
                    };
                }
                accountId = ticketResult.data.account_id as number;
            }

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'ticket.update');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to update tickets'
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

        const updateTicketResult = await updateTicket(userId, accountId!, ticketId, title, description, status, assigned_to_team_id, assigned_to_user_id);
        if(!updateTicketResult.status || !updateTicketResult.data) {
            return {
                status: false,
                data: null,
                message: updateTicketResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Ticket updated successfully'
        };

    }, 'PUT /api/tickets/[id]', 200, 400);
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

        const paramValidationResult = await validateRouteParams(ticketIdParamSchema, { id: resolvedParams.id });
        if(!paramValidationResult.status || !paramValidationResult.data) {
            return {
                status: false,
                data: null,
                message: paramValidationResult.message
            };
        }

        const ticketId = paramValidationResult.data.id;

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

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'ticket.delete');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to delete tickets'
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

        const deleteTicketResult = await deleteTicket(userId, accountId, ticketId);
        if(!deleteTicketResult.status || !deleteTicketResult.data) {
            return {
                status: false,
                data: null,
                message: deleteTicketResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Ticket deleted successfully'
        };

    }, 'DELETE /api/tickets/[id]', 200, 400);
}

