// Imports

import { NextRequest, NextResponse } from "next/server";
import { getAllTickets, createTicket } from "@/lib/service/ticket.service";
import { apiHandler, handleCloseDatabaseConnections } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { verifyAccountPermission } from "@/lib/core/validation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";
import { createTicketSchema, validateRequestBody } from "@/lib/core/zod";

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

        const getAllTicketsResult = await getAllTickets(userId, accountId);
        if(!getAllTicketsResult.status || !getAllTicketsResult.data) {
            return {
                status: false,
                data: null,
                message: getAllTicketsResult.message
            };
        }

        return {
            status: true,
            data: getAllTicketsResult.data,
            message: getAllTicketsResult.message
        };

    }, 'GET /api/tickets', 200, 400);
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

        const validationResult = await validateRequestBody(createTicketSchema, body);
        if(!validationResult.status || !validationResult.data) {
            return {
                status: false,
                data: null,
                message: validationResult.message
            };
        }

        const { title, description, status, assigned_to_user_id, accountId } = validationResult.data;

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

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, 'ticket.create');
            if(!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || 'You do not have permission to create tickets'
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

        const createTicketResult = await createTicket(userId, accountId, title, description, status, assigned_to_user_id || null);
        if(!createTicketResult.status || !createTicketResult.data) {
            return {
                status: false,
                data: null,
                message: createTicketResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Ticket created successfully'
        };

    }, 'POST /api/tickets', 201, 400);
}

