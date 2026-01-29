// Imports

import { getAllUsers, createUser, deleteUser } from '@/lib/service/user.service';
import { connectToDatabase, DatabaseClient } from '@/lib/core/database';
import { dynamicSendData, getRowsByColumnValue, getRowById, deleteRowById } from '@/lib/core/database/queries';
import { handleCloseDatabaseConnections, generatePassword, formatDate } from '@/lib/core/helper';
import { verifyAccountAccess } from '@/lib/core/validation';
import { sendEmailToUser } from '@/lib/service/email.service';
import { UserAccountRow } from '@/types/component';

// Mock all dependencies

jest.mock('@/lib/core/database', () => ({
    connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/core/database/queries', () => ({
    dynamicSendData: jest.fn(),
    getRowsByColumnValue: jest.fn(),
    getRowById: jest.fn(),
    deleteRowById: jest.fn(),
}));

jest.mock('@/lib/core/helper', () => ({
    handleCloseDatabaseConnections: jest.fn(),
    generatePassword: jest.fn(),
    formatDate: jest.fn(),
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('@/lib/core/validation', () => ({
    verifyAccountAccess: jest.fn(),
}));

jest.mock('@/lib/service/email.service', () => ({
    sendEmailToUser: jest.fn(),
}));

// Tests for User Service

describe('User Service', () => {
    let mockDbClient: jest.Mocked<DatabaseClient>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDbClient = {
            query: jest.fn(),
            release: jest.fn(),
        } as unknown as jest.Mocked<DatabaseClient>;
    });

    describe('getAllUsers', () => {
        it('should return users successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const mockUserAccounts: UserAccountRow[] = [
                {
                    id: 1,
                    user_id: 1,
                    account_id: accountId,
                    role_id: 1,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ];
            const mockUser = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashed',
                must_change_password: false,
                created_at: new Date(),
                updated_at: new Date()
            };
            const mockRole = {
                id: 1,
                name: 'admin',
                description: 'Admin role'
            };
            const mockFormattedDate = '01/01/2024';

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
                rows: mockUserAccounts
            });

            (getRowById as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockUser,
                    message: 'User found'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockRole,
                    message: 'Role found'
                });

            (formatDate as jest.Mock)
                .mockResolvedValueOnce(mockFormattedDate)
                .mockResolvedValueOnce(mockFormattedDate);

            const result = await getAllUsers(userId, accountId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([[
                '1',
                mockUser.name,
                mockUser.email,
                mockRole.name,
                mockFormattedDate,
                mockFormattedDate
            ]]);
            expect(result.message).toBe('Users retrieved successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(mockDbClient.query).toHaveBeenCalledWith(
                `SELECT * FROM user_account WHERE account_id = $1 ORDER BY created_at DESC`,
                [accountId]
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return empty array when no users found', async () => {
            const userId = 1;
            const accountId = 10;

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

            const result = await getAllUsers(userId, accountId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([]);
            expect(result.message).toBe('No users found for this account');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await getAllUsers(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(verifyAccountAccess).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;

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

            const result = await getAllUsers(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(mockDbClient.query).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when user retrieval fails', async () => {
            const userId = 1;
            const accountId = 10;
            const mockUserAccounts: UserAccountRow[] = [
                {
                    id: 1,
                    user_id: 1,
                    account_id: accountId,
                    role_id: 1,
                    created_at: new Date(),
                    updated_at: new Date()
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
                rows: mockUserAccounts
            });

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'User not found'
            });

            const result = await getAllUsers(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to retrieve some user information');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await getAllUsers(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('createUser', () => {
        it('should create new user successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test User';
            const email = 'test@example.com';
            const roleId = 2;
            const mockPassword = 'generatedPassword123';
            const mockNewUserId = 20;

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

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'User not found'
            });

            (generatePassword as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockPassword,
                message: 'Password generated'
            });

            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockNewUserId,
                    message: 'User created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: 30,
                    message: 'User account created'
                });

            (sendEmailToUser as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Email sent'
            });

            mockDbClient.query = jest.fn().mockResolvedValueOnce({
                rows: []
            });

            const result = await createUser(userId, accountId, name, email, roleId);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('User created successfully');
            expect(getRowsByColumnValue).toHaveBeenCalledWith(mockDbClient, 'users', 'email', email.toLowerCase().trim());
            expect(generatePassword).toHaveBeenCalled();
            expect(dynamicSendData).toHaveBeenCalledTimes(2);
            expect(sendEmailToUser).toHaveBeenCalledWith(
                email.toLowerCase().trim(),
                'Welcome to our platform',
                expect.stringContaining(mockPassword)
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should add existing user to account successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test User';
            const email = 'existing@example.com';
            const roleId = 2;
            const mockExistingUserId = 15;

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

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [{ id: mockExistingUserId, email: email.toLowerCase().trim() }],
                message: 'User found'
            });

            mockDbClient.query = jest.fn().mockResolvedValueOnce({
                rows: []
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: 30,
                message: 'User account created'
            });

            const result = await createUser(userId, accountId, name, email, roleId);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('User created successfully');
            expect(generatePassword).not.toHaveBeenCalled();
            expect(sendEmailToUser).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when user already has access to account', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test User';
            const email = 'existing@example.com';
            const roleId = 2;
            const mockExistingUserId = 15;

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

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [{ id: mockExistingUserId, email: email.toLowerCase().trim() }],
                message: 'User found'
            });

            mockDbClient.query = jest.fn().mockResolvedValueOnce({
                rows: [{ id: 1, user_id: mockExistingUserId, account_id: accountId }]
            });

            const result = await createUser(userId, accountId, name, email, roleId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('User already has access to this account');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test User';
            const email = 'test@example.com';
            const roleId = 2;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await createUser(userId, accountId, name, email, roleId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test User';
            const email = 'test@example.com';
            const roleId = 2;

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

            const result = await createUser(userId, accountId, name, email, roleId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when password generation fails', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test User';
            const email = 'test@example.com';
            const roleId = 2;

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

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'User not found'
            });

            (generatePassword as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to generate password'
            });

            const result = await createUser(userId, accountId, name, email, roleId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to generate password');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when creating user fails', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test User';
            const email = 'test@example.com';
            const roleId = 2;
            const mockPassword = 'generatedPassword123';

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

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'User not found'
            });

            (generatePassword as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockPassword,
                message: 'Password generated'
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to create user'
            });

            const result = await createUser(userId, accountId, name, email, roleId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create user');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when creating user_account fails', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test User';
            const email = 'test@example.com';
            const roleId = 2;
            const mockPassword = 'generatedPassword123';
            const mockNewUserId = 20;

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

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'User not found'
            });

            (generatePassword as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockPassword,
                message: 'Password generated'
            });

            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockNewUserId,
                    message: 'User created'
                })
                .mockResolvedValueOnce({
                    status: false,
                    data: null,
                    message: 'Failed to create user_account'
                });

            (sendEmailToUser as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Email sent'
            });

            mockDbClient.query = jest.fn().mockResolvedValueOnce({
                rows: []
            });

            const result = await createUser(userId, accountId, name, email, roleId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create user_account');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test User';
            const email = 'test@example.com';
            const roleId = 2;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await createUser(userId, accountId, name, email, roleId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const userAccountId = 5;
            const mockUserAccount = {
                id: userAccountId,
                user_id: 15,
                account_id: accountId,
                role_id: 2,
                created_at: new Date(),
                updated_at: new Date()
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

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUserAccount,
                message: 'User account found'
            });

            (deleteRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'User account deleted'
            });

            const result = await deleteUser(userId, accountId, userAccountId);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('User access removed successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(getRowById).toHaveBeenCalledWith(mockDbClient, 'user_account', userAccountId);
            expect(deleteRowById).toHaveBeenCalledWith(mockDbClient, 'user_account', userAccountId);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;
            const userAccountId = 5;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await deleteUser(userId, accountId, userAccountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;
            const userAccountId = 5;

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

            const result = await deleteUser(userId, accountId, userAccountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(getRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when user account not found', async () => {
            const userId = 1;
            const accountId = 10;
            const userAccountId = 5;

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

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'User account not found'
            });

            const result = await deleteUser(userId, accountId, userAccountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('User account relationship not found');
            expect(deleteRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when user account does not belong to account', async () => {
            const userId = 1;
            const accountId = 10;
            const userAccountId = 5;
            const mockUserAccount = {
                id: userAccountId,
                user_id: 15,
                account_id: 99,
                role_id: 2,
                created_at: new Date(),
                updated_at: new Date()
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

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUserAccount,
                message: 'User account found'
            });

            const result = await deleteUser(userId, accountId, userAccountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('User account does not belong to this account');
            expect(deleteRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when delete fails', async () => {
            const userId = 1;
            const accountId = 10;
            const userAccountId = 5;
            const mockUserAccount = {
                id: userAccountId,
                user_id: 15,
                account_id: accountId,
                role_id: 2,
                created_at: new Date(),
                updated_at: new Date()
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

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUserAccount,
                message: 'User account found'
            });

            (deleteRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to delete user account'
            });

            const result = await deleteUser(userId, accountId, userAccountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to delete user account');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;
            const userAccountId = 5;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await deleteUser(userId, accountId, userAccountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });
});

