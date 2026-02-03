// Imports

import { getCommentsByTicketId, createComment, deleteCommentsByTicketId } from '@/lib/service/comment.service';
import { connectToDatabase, DatabaseClient } from '@/lib/core/database';
import { getRowById, dynamicSendData, deleteCommentsByTicketId as deleteCommentsByTicketIdQuery } from '@/lib/core/database/queries';
import { handleCloseDatabaseConnections } from '@/lib/core/helper';
import { verifyAccountAccess } from '@/lib/core/validation';

// Mock all dependencies

jest.mock('@/lib/core/database', () => ({
    connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/core/database/queries', () => ({
    getRowById: jest.fn(),
    dynamicSendData: jest.fn(),
    deleteCommentsByTicketId: jest.fn(),
}));

jest.mock('@/lib/core/helper', () => ({
    handleCloseDatabaseConnections: jest.fn(),
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('@/lib/core/validation', () => ({
    verifyAccountAccess: jest.fn(),
}));

// Tests for Comment Service

describe('Comment Service', () => {
    let mockDbClient: jest.Mocked<DatabaseClient>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDbClient = {
            query: jest.fn(),
            release: jest.fn(),
        } as unknown as jest.Mocked<DatabaseClient>;
    });

    describe('getCommentsByTicketId', () => {
        it('should return comments successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const mockComments = [
                {
                    id: 1,
                    text: 'First comment',
                    author_id: 1,
                    ticket_id: ticketId,
                    account_id: accountId,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date('2024-01-01')
                },
                {
                    id: 2,
                    text: 'Second comment',
                    author_id: 2,
                    ticket_id: ticketId,
                    account_id: accountId,
                    created_at: new Date('2024-01-02'),
                    updated_at: new Date('2024-01-02')
                }
            ];
            const mockUser1 = {
                id: 1,
                name: 'User One',
                email: 'user1@example.com'
            };
            const mockUser2 = {
                id: 2,
                name: 'User Two',
                email: 'user2@example.com'
            };

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            mockDbClient.query = jest.fn().mockResolvedValueOnce({
                rows: mockComments
            });

            (getRowById as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockUser1,
                    message: 'User found'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockUser2,
                    message: 'User found'
                });

            const result = await getCommentsByTicketId(userId, accountId, ticketId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([
                {
                    id: 2,
                    comment: 'Second comment',
                    created_by: 'User Two',
                    updated_at: new Date('2024-01-02').toISOString()
                },
                {
                    id: 1,
                    comment: 'First comment',
                    created_by: 'User One',
                    updated_at: new Date('2024-01-01').toISOString()
                }
            ]);
            expect(result.message).toBe('Comments retrieved successfully');
            expect(connectToDatabase).toHaveBeenCalledWith(false);
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(mockDbClient.query).toHaveBeenCalledWith(
                `SELECT * FROM comment WHERE ticket_id = $1 AND account_id = $2 ORDER BY created_at DESC`,
                [ticketId, accountId]
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return empty array when no comments found', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            mockDbClient.query = jest.fn().mockResolvedValueOnce({
                rows: []
            });

            const result = await getCommentsByTicketId(userId, accountId, ticketId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([]);
            expect(result.message).toBe('No comments found for this ticket');
            expect(getRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return "Unknown" when user not found for comment author', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const mockComments = [
                {
                    id: 1,
                    text: 'Comment without user',
                    author_id: 999,
                    ticket_id: ticketId,
                    account_id: accountId,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date('2024-01-01')
                }
            ];

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            mockDbClient.query = jest.fn().mockResolvedValueOnce({
                rows: mockComments
            });

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'User not found'
            });

            const result = await getCommentsByTicketId(userId, accountId, ticketId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([
                {
                    id: 1,
                    comment: 'Comment without user',
                    created_by: 'Unknown',
                    updated_at: new Date('2024-01-01').toISOString()
                }
            ]);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return "Unknown" when comment has no author_id', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const mockComments = [
                {
                    id: 1,
                    text: 'Comment without author',
                    author_id: null,
                    ticket_id: ticketId,
                    account_id: accountId,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date('2024-01-01')
                }
            ];

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            mockDbClient.query = jest.fn().mockResolvedValueOnce({
                rows: mockComments
            });

            const result = await getCommentsByTicketId(userId, accountId, ticketId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([
                {
                    id: 1,
                    comment: 'Comment without author',
                    created_by: 'Unknown',
                    updated_at: new Date('2024-01-01').toISOString()
                }
            ]);
            expect(getRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await getCommentsByTicketId(userId, accountId, ticketId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(verifyAccountAccess).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: false,
                message: 'Access denied'
            });

            const result = await getCommentsByTicketId(userId, accountId, ticketId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(mockDbClient.query).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await getCommentsByTicketId(userId, accountId, ticketId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should handle comments with missing text field', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const mockComments = [
                {
                    id: 1,
                    text: null,
                    author_id: 1,
                    ticket_id: ticketId,
                    account_id: accountId,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date('2024-01-01')
                }
            ];
            const mockUser = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com'
            };

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            mockDbClient.query = jest.fn().mockResolvedValueOnce({
                rows: mockComments
            });

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUser,
                message: 'User found'
            });

            const result = await getCommentsByTicketId(userId, accountId, ticketId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([
                {
                    id: 1,
                    comment: '',
                    created_by: 'Test User',
                    updated_at: new Date('2024-01-01').toISOString()
                }
            ]);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });
    });

    describe('createComment', () => {
        it('should create comment successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const text = 'This is a test comment';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Comment created'
            });

            const result = await createComment(userId, accountId, ticketId, text);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Comment created successfully');
            expect(connectToDatabase).toHaveBeenCalledWith(false);
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(dynamicSendData).toHaveBeenCalledWith(
                mockDbClient,
                'comment',
                ['text', 'ticket_id', 'author_id', 'account_id'],
                [text.trim(), ticketId, userId, accountId]
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should trim whitespace from comment text', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const text = '  This is a test comment  ';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Comment created'
            });

            const result = await createComment(userId, accountId, ticketId, text);

            expect(result.status).toBe(true);
            expect(dynamicSendData).toHaveBeenCalledWith(
                mockDbClient,
                'comment',
                ['text', 'ticket_id', 'author_id', 'account_id'],
                ['This is a test comment', ticketId, userId, accountId]
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when comment text is empty', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const text = '   ';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            const result = await createComment(userId, accountId, ticketId, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Comment text is required');
            expect(dynamicSendData).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when comment text is too long', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const text = 'a'.repeat(1025);

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            const result = await createComment(userId, accountId, ticketId, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Comment text must be 1024 characters or less');
            expect(dynamicSendData).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should accept comment text at exactly 1024 characters', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const text = 'a'.repeat(1024);

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Comment created'
            });

            const result = await createComment(userId, accountId, ticketId, text);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(dynamicSendData).toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const text = 'Test comment';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await createComment(userId, accountId, ticketId, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(verifyAccountAccess).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const text = 'Test comment';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: false,
                message: 'Access denied'
            });

            const result = await createComment(userId, accountId, ticketId, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(dynamicSendData).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when dynamicSendData fails', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const text = 'Test comment';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (verifyAccountAccess as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Access granted'
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to create comment'
            });

            const result = await createComment(userId, accountId, ticketId, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create comment');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;
            const ticketId = 5;
            const text = 'Test comment';

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await createComment(userId, accountId, ticketId, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('deleteCommentsByTicketId', () => {
        it('should delete comments successfully', async () => {
            const accountId = 10;
            const ticketId = 5;

            (deleteCommentsByTicketIdQuery as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Comments deleted successfully'
            });

            const result = await deleteCommentsByTicketId(mockDbClient, accountId, ticketId);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Comments deleted successfully');
            expect(deleteCommentsByTicketIdQuery).toHaveBeenCalledWith(mockDbClient, accountId, ticketId);
        });

        it('should return error when deleteCommentsByTicketIdQuery fails', async () => {
            const accountId = 10;
            const ticketId = 5;

            (deleteCommentsByTicketIdQuery as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to delete comments'
            });

            const result = await deleteCommentsByTicketId(mockDbClient, accountId, ticketId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to delete comments');
            expect(deleteCommentsByTicketIdQuery).toHaveBeenCalledWith(mockDbClient, accountId, ticketId);
        });

        it('should return false when no comments are deleted', async () => {
            const accountId = 10;
            const ticketId = 5;

            (deleteCommentsByTicketIdQuery as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: false,
                message: 'No comments found to delete'
            });

            const result = await deleteCommentsByTicketId(mockDbClient, accountId, ticketId);

            expect(result.status).toBe(true);
            expect(result.data).toBe(false);
            expect(result.message).toBe('No comments found to delete');
            expect(deleteCommentsByTicketIdQuery).toHaveBeenCalledWith(mockDbClient, accountId, ticketId);
        });
    });
});

