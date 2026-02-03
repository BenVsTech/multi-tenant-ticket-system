// Imports

import { NextRequest, NextResponse } from "next/server";
import { getCommentsByTicketId, createComment } from "@/lib/service/comment.service";
import { apiHandler } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";

// Exports

export async function GET(request: NextRequest): Promise<NextResponse<DataReturnObject<{id: number, comment: string, created_by: string, updated_at: string}[]>>> {
    return apiHandler<{id: number, comment: string, created_by: string, updated_at: string}[]>(async () => {

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
        const ticketIdParam = searchParams.get('ticketId');
        const accountIdParam = searchParams.get('accountId');
        
        if(!ticketIdParam) {
            return {
                status: false,
                data: null,
                message: 'Ticket ID is required'
            };
        }

        if(!accountIdParam) {
            return {
                status: false,
                data: null,
                message: 'Account ID is required'
            };
        }

        const ticketId = parseInt(ticketIdParam);
        if(isNaN(ticketId) || ticketId <= 0) {
            return {
                status: false,
                data: null,
                message: 'Invalid ticket ID'
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

        const getCommentsResult = await getCommentsByTicketId(userId, accountId, ticketId);
        if(!getCommentsResult.status || getCommentsResult.data === null) {
            return {
                status: false,
                data: null,
                message: getCommentsResult.message
            };
        }

        return {
            status: true,
            data: getCommentsResult.data,
            message: getCommentsResult.message
        };

    }, 'GET /api/comments', 200, 400);
}

export async function POST(request: NextRequest): Promise<NextResponse<DataReturnObject<boolean>>> {
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
        const { text, ticketId, accountId } = body;

        if(!text || typeof text !== 'string' || text.trim().length === 0) {
            return {
                status: false,
                data: null,
                message: 'Comment text is required'
            };
        }

        if(!ticketId) {
            return {
                status: false,
                data: null,
                message: 'Ticket ID is required'
            };
        }

        if(!accountId) {
            return {
                status: false,
                data: null,
                message: 'Account ID is required'
            };
        }

        const ticketIdNum = parseInt(ticketId);
        if(isNaN(ticketIdNum) || ticketIdNum <= 0) {
            return {
                status: false,
                data: null,
                message: 'Invalid ticket ID'
            };
        }

        const accountIdNum = parseInt(accountId);
        if(isNaN(accountIdNum) || accountIdNum <= 0) {
            return {
                status: false,
                data: null,
                message: 'Invalid account ID'
            };
        }

        const createCommentResult = await createComment(userId, accountIdNum, ticketIdNum, text);
        if(!createCommentResult.status || createCommentResult.data === null) {
            return {
                status: false,
                data: null,
                message: createCommentResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: createCommentResult.message
        };

    }, 'POST /api/comments', 200, 400);
}

