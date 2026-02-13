// Imports

import { NextRequest, NextResponse } from "next/server";
import { assignTicketToSelf } from "@/lib/service/myTicket.service";
import { apiHandler, handleCloseDatabaseConnections } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { verifyAccountPermission } from "@/lib/core/validation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";

// Exports

export async function POST(request: NextRequest): Promise<NextResponse<DataReturnObject<boolean>>> {
    return apiHandler<boolean>(async () => {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return {
                status: false,
                data: null,
                message: "Unauthorized",
            };
        }

        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const accountIdParam = searchParams.get("accountId");
        if (!accountIdParam) {
            return {
                status: false,
                data: null,
                message: "Account ID is required",
            };
        }

        const accountId = parseInt(accountIdParam);
        if (isNaN(accountId) || accountId <= 0) {
            return {
                status: false,
                data: null,
                message: "Invalid account ID",
            };
        }

        let body: { ticketId?: number };
        try {
            body = await request.json();
        } catch {
            return {
                status: false,
                data: null,
                message: "Invalid request body",
            };
        }

        const ticketId = typeof body.ticketId === "number" ? body.ticketId : parseInt(String(body.ticketId ?? ""), 10);
        if (isNaN(ticketId) || ticketId <= 0) {
            return {
                status: false,
                data: null,
                message: "Valid ticket ID is required",
            };
        }

        let dbClient: DatabaseClient | null = null;

        try {
            const databaseConnection = await connectToDatabase(false);
            if (!databaseConnection.status || !databaseConnection.data) {
                return {
                    status: false,
                    data: null,
                    message: databaseConnection.message,
                };
            }

            dbClient = databaseConnection.data;

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, "ticket.update");
            if (!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || "You do not have permission to update tickets",
                };
            }
        } catch (error: unknown) {
            return {
                status: false,
                data: null,
                message: "Failed to verify permissions",
            };
        } finally {
            await handleCloseDatabaseConnections(null, dbClient);
        }

        const result = await assignTicketToSelf(userId, accountId, ticketId);
        if (!result.status || !result.data) {
            return {
                status: false,
                data: null,
                message: result.message,
            };
        }

        return {
            status: true,
            data: true,
            message: "Ticket assigned to you successfully",
        };
    }, "POST /api/tickets/my/assign", 200, 400);
}
