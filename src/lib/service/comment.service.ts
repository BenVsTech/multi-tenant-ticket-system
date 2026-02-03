// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { getRowById, dynamicSendData, deleteCommentsByTicketId as deleteCommentsByTicketIdQuery } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger } from "@/lib/core/helper";
import { verifyAccountAccess } from "@/lib/core/validation";
import { DataReturnObject } from "@/types/helper";

// Exports

export async function getCommentsByTicketId(userId: number, accountId: number, ticketId: number): Promise<DataReturnObject<{id: number, comment: string, created_by: string, updated_at: string}[]>> {

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

        const commentsQuery = await dbClient.query(
            `SELECT * FROM comment WHERE ticket_id = $1 AND account_id = $2 ORDER BY created_at DESC`,
            [ticketId, accountId]
        );
        
        const comments = commentsQuery.rows || [];

        if(comments.length === 0) {
            return {
                status: true,
                data: [],
                message: 'No comments found for this ticket'
            };
        }

        const commentsResult = await Promise.all(comments.map(async (comment: any) => {
            let createdByName = 'Unknown';
            if(comment.author_id) {
                const userResult = await getRowById(dbClient!, 'users', comment.author_id);
                if(userResult.status && userResult.data) {
                    createdByName = userResult.data.name as string || 'Unknown';
                }
            }

            return {
                id: comment.id,
                comment: comment.text || '',
                created_by: createdByName,
                updated_at: comment.updated_at ? new Date(comment.updated_at).toISOString() : ''
            };
        }));

        return {
            status: true,
            data: commentsResult,
            message: 'Comments retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getCommentsByTicketId', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function createComment(userId: number, accountId: number, ticketId: number, text: string): Promise<DataReturnObject<boolean>> {

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

        if(!text || text.trim().length === 0) {
            return {
                status: false,
                data: null,
                message: 'Comment text is required'
            };
        }

        if(text.length > 1024) {
            return {
                status: false,
                data: null,
                message: 'Comment text must be 1024 characters or less'
            };
        }

        const createCommentResult = await dynamicSendData(
            dbClient,
            'comment',
            ['text', 'ticket_id', 'author_id', 'account_id'],
            [text.trim(), ticketId, userId, accountId]
        );
        if(!createCommentResult.status || !createCommentResult.data) {
            return {
                status: false,
                data: null,
                message: createCommentResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Comment created successfully'
        };

    } catch(error: unknown) {
        logger.error('createComment', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function deleteCommentsByTicketId(dbClient: DatabaseClient, accountId: number, ticketId: number): Promise<DataReturnObject<boolean>> {
    return deleteCommentsByTicketIdQuery(dbClient, accountId, ticketId);
}

