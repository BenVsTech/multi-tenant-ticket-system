// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { getTeamIdForUserInAccount, getOpenTicketsForTeam, getTicketsCreatedByUser, getTicketsAssignedToUser } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger, formatDate } from "@/lib/core/helper";
import { verifyAccountAccess } from "@/lib/core/validation";
import { DataReturnObject } from "@/types/helper";
import { updateTicket } from "@/lib/service/ticket.service";

// Types

export interface MyTicketsData {
    open: string[][];
    created: string[][];
    assigned: string[][];
}

type TicketRow = {
    id: number;
    title: string;
    status: string;
    updated_at: Date | string;
    created_at: Date | string;
};

// Functions

async function formatTicketsToRows(tickets: TicketRow[]): Promise<string[][]> {
    return Promise.all(
        tickets.map(async (ticket) => [
            ticket.id.toString(),
            ticket.title ?? "",
            ticket.status ?? "",
            await formatDate(ticket.updated_at),
            await formatDate(ticket.created_at),
        ])
    );
}

// Exports

export async function getMyTickets(userId: number, accountId: number): Promise<DataReturnObject<MyTicketsData>> {
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

        const accessCheck = await verifyAccountAccess(dbClient, userId, accountId);
        if (!accessCheck.status || !accessCheck.data) {
            return {
                status: false,
                data: null,
                message: "You do not have access to this account",
            };
        }

        const teamResult = await getTeamIdForUserInAccount(dbClient, userId, accountId);
        if (!teamResult.status) {
            return {
                status: false,
                data: null,
                message: teamResult.message ?? "Failed to get user team",
            };
        }

        const teamId = teamResult.data;

        const [openResult, createdResult, assignedResult] = await Promise.all([
            teamId !== null
                ? getOpenTicketsForTeam(dbClient, accountId, teamId)
                : Promise.resolve({ status: true as const, data: [] as TicketRow[], message: "" }),
            getTicketsCreatedByUser(dbClient, accountId, userId),
            getTicketsAssignedToUser(dbClient, accountId, userId),
        ]);

        const openTickets = openResult.status && openResult.data ? openResult.data : [];
        const createdTickets = createdResult.status && createdResult.data ? createdResult.data : [];
        const assignedTickets = assignedResult.status && assignedResult.data ? assignedResult.data : [];

        const [open, created, assigned] = await Promise.all([
            formatTicketsToRows(openTickets as TicketRow[]),
            formatTicketsToRows(createdTickets as TicketRow[]),
            formatTicketsToRows(assignedTickets as TicketRow[]),
        ]);

        return {
            status: true,
            data: { open, created, assigned },
            message: "My tickets retrieved successfully",
        };
    } catch (error: unknown) {
        logger.error("getMyTickets", error);
        return {
            status: false,
            data: null,
            message: "Failed to fetch my tickets",
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function assignTicketToSelf(
    userId: number,
    accountId: number,
    ticketId: number
): Promise<DataReturnObject<boolean>> {
    return updateTicket(
        userId,
        accountId,
        ticketId,
        undefined,
        undefined,
        "Backlog",
        undefined,
        userId
    );
}
