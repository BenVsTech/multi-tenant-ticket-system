// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { getAllRowsFromTable, getRowById, deleteRowById, dynamicSendData, updateRowById, teamExistsInAccount, userAccountExists, getTicketsByAccountOrdered } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger, formatDate } from "@/lib/core/helper";
import { verifyAccountAccess } from "@/lib/core/validation";
import { DataReturnObject } from "@/types/helper";
import { deleteCommentsByTicketId } from "./comment.service";

// Exports

export async function getTicketsForOptions(userId: number, accountId: number): Promise<DataReturnObject<{id: number, name: string}[]>> {

    let dbClient: DatabaseClient | null = null;

    try{

        const databaseConnection = await connectToDatabase(false);
        if(!databaseConnection.status || !databaseConnection.data) {
            return {
                status: false,
                data: null,
                message: databaseConnection.message
            };
        }
        
        dbClient = databaseConnection.data;

        const accessCheck = await verifyAccountAccess(dbClient, userId, accountId);
        if (!accessCheck.status || !accessCheck.data) {
            return {
                status: false,
                data: null,
                message: 'You do not have access to this account'
            };
        }

        const getTicketsResult = await getAllRowsFromTable(dbClient, 'ticket', accountId);
        if(!getTicketsResult.status || !getTicketsResult.data) {
            return {
                status: false,
                data: null,
                message: getTicketsResult.message
            };
        }

        const tickets = getTicketsResult.data;

        const ticketsForOptions = tickets.map((ticket: any) => ({
            id: ticket.id,
            name: ticket.title
        }));

        return {
            status: true,
            data: ticketsForOptions,
            message: 'Tickets retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getTicketsForOptions', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function getTicketById(userId: number, accountId: number, ticketId: number): Promise<DataReturnObject<{title: string, description: string, status: string, assigned_to_team_id: number, assigned_to_user_id: number | null}>> {

    let dbClient: DatabaseClient | null = null;

    try{

        const databaseConnection = await connectToDatabase(false);
        if(!databaseConnection.status || !databaseConnection.data) {
            return {
                status: false,
                data: null,
                message: databaseConnection.message
            };
        }
        
        dbClient = databaseConnection.data;

        const accessCheck = await verifyAccountAccess(dbClient, userId, accountId);
        if (!accessCheck.status || !accessCheck.data) {
            return {
                status: false,
                data: null,
                message: 'You do not have access to this account'
            };
        }

        const ticketResult = await getRowById(dbClient, 'ticket', ticketId, accountId);
        if(!ticketResult.status || !ticketResult.data) {
            return {
                status: false,
                data: null,
                message: 'Ticket not found'
            };
        }

        const ticketTitle = ticketResult.data.title;
        const ticketDescription = ticketResult.data.description;
        const ticketStatus = ticketResult.data.status;
        const assignedToTeamId = ticketResult.data.assigned_to_team_id as number;
        const assignedToUserId = ticketResult.data.assigned_to_user_id as number | null;

        if(typeof ticketTitle !== 'string' || typeof ticketDescription !== 'string' || typeof ticketStatus !== 'string' || typeof assignedToTeamId !== 'number') {
            return {
                status: false,
                data: null,
                message: 'Invalid ticket data'
            };
        }

        return {
            status: true,
            data: {
                title: ticketTitle,
                description: ticketDescription,
                status: ticketStatus,
                assigned_to_team_id: assignedToTeamId,
                assigned_to_user_id: assignedToUserId
            },
            message: 'Ticket retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getTicketById', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function getTickets(accountId: number): Promise<DataReturnObject<{id: number, title: string, description: string, status: string, assigned_to_team_id: number, assigned_to_user_id: number | null}[]>> {

    let dbClient: DatabaseClient | null = null;

    try{

        const databaseConnection = await connectToDatabase(false);
        if(!databaseConnection.status || !databaseConnection.data) {
            return {
                status: false,
                data: null,
                message: databaseConnection.message
            };
        }
        
        dbClient = databaseConnection.data;

        const getTicketsResult = await getAllRowsFromTable(dbClient, 'ticket', accountId);
        if(!getTicketsResult.status || !getTicketsResult.data) {
            return {
                status: false,
                data: null,
                message: getTicketsResult.message
            };
        }

        return {
            status: true,
            data: getTicketsResult.data as {id: number, title: string, description: string, status: string, assigned_to_team_id: number, assigned_to_user_id: number | null}[],
            message: 'Tickets retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getTickets', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function getAllTickets(userId: number, accountId: number): Promise<DataReturnObject<string[][]>> {

    let dbClient: DatabaseClient | null = null;

    try{

        const databaseConnection = await connectToDatabase(false);
        if(!databaseConnection.status || !databaseConnection.data) {
            return {
                status: false,
                data: null,
                message: databaseConnection.message
            };
        }
        
        dbClient = databaseConnection.data;

        const accessCheck = await verifyAccountAccess(dbClient, userId, accountId);
        if (!accessCheck.status || !accessCheck.data) {
            return {
                status: false,
                data: null,
                message: 'You do not have access to this account'
            };
        }

        const orderedTicketsResult = await getTicketsByAccountOrdered(dbClient, accountId);
        if(!orderedTicketsResult.status || !orderedTicketsResult.data) {
            return {
                status: false,
                data: null,
                message: orderedTicketsResult.message
            };
        }

        const tickets = orderedTicketsResult.data;

        if(tickets.length === 0) {
            return {
                status: true,
                data: [],
                message: 'No tickets found for this account'
            };
        }

        const ticketsResult = await Promise.all(tickets.map(async (ticket: any) => {
            let assignedUserName = 'Unassigned';
            if(ticket.assigned_to_user_id) {
                const userResult = await getRowById(dbClient!, 'users', ticket.assigned_to_user_id);
                if(userResult.status && userResult.data) {
                    assignedUserName = userResult.data.name as string || 'Unknown';
                }
            }

            let createdByName = 'Unknown';
            if(ticket.created_by_user_id) {
                const creatorResult = await getRowById(dbClient!, 'users', ticket.created_by_user_id);
                if(creatorResult.status && creatorResult.data) {
                    createdByName = creatorResult.data.name as string || 'Unknown';
                }
            }

            return [
                ticket.id.toString(),
                ticket.title,
                ticket.status,
                createdByName,
                assignedUserName,
                await formatDate(ticket.updated_at),
                await formatDate(ticket.created_at)
            ];
        }));

        return {
            status: true,
            data: ticketsResult,
            message: 'Tickets retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getAllTickets', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function createTicket(userId: number, accountId: number, title: string, description: string, status: string, assignedToTeamId: number, assignedToUserId: number | null): Promise<DataReturnObject<boolean>> {

    let dbClient: DatabaseClient | null = null;

    try{

        const databaseConnection = await connectToDatabase(false);
        if(!databaseConnection.status || !databaseConnection.data) {
            return {
                status: false,
                data: null,
                message: databaseConnection.message
            };
        }
        
        dbClient = databaseConnection.data;

        const accessCheck = await verifyAccountAccess(dbClient, userId, accountId);
        if (!accessCheck.status || !accessCheck.data) {
            return {
                status: false,
                data: null,
                message: 'You do not have access to this account'
            };
        }

        const teamCheck = await teamExistsInAccount(dbClient, assignedToTeamId, accountId);
        if(!teamCheck.status || !teamCheck.data) {
            return {
                status: false,
                data: null,
                message: teamCheck.message ?? 'Assigned team does not belong to this account'
            };
        }

        if(assignedToUserId !== null) {
            const userAccountCheck = await userAccountExists(dbClient, assignedToUserId, accountId);
            if(!userAccountCheck.status || !userAccountCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: userAccountCheck.message ?? 'Assigned user does not belong to this account'
                };
            }
        }

        const createTicketResult = await dynamicSendData(
            dbClient,
            'ticket',
            ['title', 'description', 'status', 'created_by_user_id', 'assigned_to_team_id', 'assigned_to_user_id', 'account_id'],
            [title, description, status, userId, assignedToTeamId, assignedToUserId, accountId]
        );
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

    } catch(error: unknown) {
        logger.error('createTicket', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function updateTicket(userId: number, accountId: number, ticketId: number, title?: string, description?: string, status?: string, assignedToTeamId?: number, assignedToUserId?: number | null): Promise<DataReturnObject<boolean>> {

    let dbClient: DatabaseClient | null = null;

    try{

        const databaseConnection = await connectToDatabase(false);
        if(!databaseConnection.status || !databaseConnection.data) {
            return {
                status: false,
                data: null,
                message: databaseConnection.message
            };
        }
        
        dbClient = databaseConnection.data;

        const accessCheck = await verifyAccountAccess(dbClient, userId, accountId);
        if (!accessCheck.status || !accessCheck.data) {
            return {
                status: false,
                data: null,
                message: 'You do not have access to this account'
            };
        }

        const ticketResult = await getRowById(dbClient, 'ticket', ticketId, accountId);
        if(!ticketResult.status || !ticketResult.data) {
            return {
                status: false,
                data: null,
                message: 'Ticket not found'
            };
        }

        if(assignedToTeamId !== undefined) {
            const teamCheck = await teamExistsInAccount(dbClient, assignedToTeamId, accountId);
            if(!teamCheck.status || !teamCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: teamCheck.message ?? 'Assigned team does not belong to this account'
                };
            }
        }

        if(assignedToUserId !== undefined && assignedToUserId !== null) {
            const userAccountCheck = await userAccountExists(dbClient, assignedToUserId, accountId);
            if(!userAccountCheck.status || !userAccountCheck.data) {
                return {
                    status: false,
                    data: null,
                    message: userAccountCheck.message ?? 'Assigned user does not belong to this account'
                };
            }
        }

        const updateData: { title?: string; description?: string; status?: string; assigned_to_team_id?: number; assigned_to_user_id?: number | null } = {};
        if(title !== undefined) updateData.title = title;
        if(description !== undefined) updateData.description = description;
        if(status !== undefined) updateData.status = status;
        if(assignedToTeamId !== undefined) updateData.assigned_to_team_id = assignedToTeamId;
        if(assignedToUserId !== undefined) updateData.assigned_to_user_id = assignedToUserId;

        if(Object.keys(updateData).length === 0) {
            return {
                status: false,
                data: null,
                message: 'No fields to update'
            };
        }

        const updateDataColumns = Object.keys(updateData);
        const updateDataValues = Object.values(updateData);

        const updateTicketResult = await updateRowById(
            dbClient,
            'ticket',
            updateDataColumns,
            updateDataValues,
            ticketId,
            accountId
        );
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

    } catch(error: unknown) {
        logger.error('updateTicket', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function deleteTicket(userId: number, accountId: number, ticketId: number): Promise<DataReturnObject<boolean>> {

    let dbClient: DatabaseClient | null = null;

    try{

        const databaseConnection = await connectToDatabase(false);
        if(!databaseConnection.status || !databaseConnection.data) {
            return {
                status: false,
                data: null,
                message: databaseConnection.message
            };
        }
        
        dbClient = databaseConnection.data;

        const accessCheck = await verifyAccountAccess(dbClient, userId, accountId);
        if (!accessCheck.status || !accessCheck.data) {
            return {
                status: false,
                data: null,
                message: 'You do not have access to this account'
            };
        }

        const ticketResult = await getRowById(dbClient, 'ticket', ticketId, accountId);
        if(!ticketResult.status || !ticketResult.data) {
            return {
                status: false,
                data: null,
                message: 'Ticket not found'
            };
        }

        const deleteCommentsResult = await deleteCommentsByTicketId(dbClient, accountId, ticketId);
        if(!deleteCommentsResult.status) {
            logger.error('deleteTicket - Failed to delete comments', { ticketId, accountId });
        }

        const deleteResult = await deleteRowById(dbClient, 'ticket', ticketId, accountId);
        if(!deleteResult.status || !deleteResult.data) {
            return {
                status: false,
                data: null,
                message: deleteResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Ticket deleted successfully'
        };

    } catch(error: unknown) {
        logger.error('deleteTicket', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

