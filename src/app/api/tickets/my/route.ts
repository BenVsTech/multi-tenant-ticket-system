// Imports

import { NextRequest, NextResponse } from "next/server";
import { getMyTickets } from "@/lib/service/myTicket.service";
import { apiHandler, handleCloseDatabaseConnections } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { verifyAccountPermission } from "@/lib/core/validation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";
import type { MyTicketsData } from "@/lib/service/myTicket.service";

// Exports

export async function GET(request: NextRequest): Promise<NextResponse<DataReturnObject<MyTicketsData>>> {
    return apiHandler<MyTicketsData>(async () => {
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

            const permissionCheck = await verifyAccountPermission(dbClient, userId, accountId, "ticket.view");
            if (!permissionCheck.status || !permissionCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionCheck.message || "You do not have permission to view tickets",
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

        const result = await getMyTickets(userId, accountId);
        if (!result.status || !result.data) {
            return {
                status: false,
                data: null,
                message: result.message,
            };
        }

        return {
            status: true,
            data: result.data,
            message: result.message,
        };
    }, "GET /api/tickets/my", 200, 400);
}
