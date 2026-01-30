// Imports

import { getAccounts, createAccount, getAccountById, updateAccount, deleteAccount } from '@/lib/service/account.service';
import { connectToDatabase, DatabaseClient } from '@/lib/core/database';
import { dynamicSendData, getRowsByColumnValue, getStringRowsAccounts, updateRowById, getRowById, deleteRowById } from '@/lib/core/database/queries';
import { handleCloseDatabaseConnections } from '@/lib/core/helper';
import { verifyAccountAccess, verifyAccountRole } from '@/lib/core/validation';
import { UpdateAccountData } from '@/types/component';

// Mock all dependencies

jest.mock('@/lib/core/database', () => ({
    connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/core/database/queries', () => ({
    dynamicSendData: jest.fn(),
    getRowsByColumnValue: jest.fn(),
    getStringRowsAccounts: jest.fn(),
    updateRowById: jest.fn(),
    getRowById: jest.fn(),
    deleteRowById: jest.fn(),
}));

jest.mock('@/lib/core/helper', () => ({
    handleCloseDatabaseConnections: jest.fn(),
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('@/lib/core/validation', () => ({
    verifyAccountAccess: jest.fn(),
    verifyAccountRole: jest.fn(),
}));

// Tests for Account Service

describe('Account Service', () => {
    let mockDbClient: jest.Mocked<DatabaseClient>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDbClient = {
            query: jest.fn(),
            release: jest.fn(),
        } as unknown as jest.Mocked<DatabaseClient>;
    });

    describe('getAccounts', () => {
        it('should return accounts successfully', async () => {
            const userId = 1;
            const mockAccounts = [['1', 'Account 1'], ['2', 'Account 2']];

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getStringRowsAccounts as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockAccounts,
                message: 'Accounts retrieved'
            });

            const result = await getAccounts(userId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual(mockAccounts);
            expect(result.message).toBe('Accounts retrieved');
            expect(connectToDatabase).toHaveBeenCalledWith(false);
            expect(getStringRowsAccounts).toHaveBeenCalledWith(mockDbClient, userId);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await getAccounts(userId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(getStringRowsAccounts).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when getStringRowsAccounts fails', async () => {
            const userId = 1;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getStringRowsAccounts as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to get accounts'
            });

            const result = await getAccounts(userId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to get accounts');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await getAccounts(userId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('createAccount', () => {
        it('should create account successfully', async () => {
            const userId = 1;
            const name = 'Test Account';
            const description = 'Test Description';
            const mockAccountId = 10;
            const mockOwnerRoleId = 1;
            const mockTeamId = 30;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockAccountId,
                    message: 'Account created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockTeamId,
                    message: 'Team created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: 20,
                    message: 'User account created'
                });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [{ id: mockOwnerRoleId, name: 'owner' }],
                message: 'Role found'
            });

            const result = await createAccount(userId, name, description);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Account created successfully');
            expect(dynamicSendData).toHaveBeenCalledTimes(3);
            expect(dynamicSendData).toHaveBeenNthCalledWith(
                1,
                mockDbClient,
                'account',
                ['name', 'description'],
                [name, description]
            );
            expect(dynamicSendData).toHaveBeenNthCalledWith(
                2,
                mockDbClient,
                'team',
                ['name', 'description', 'account_id'],
                ['administration', 'Default administration team for account management', mockAccountId]
            );
            expect(dynamicSendData).toHaveBeenNthCalledWith(
                3,
                mockDbClient,
                'user_account',
                ['user_id', 'account_id', 'role_id', 'team_id'],
                [userId, mockAccountId, mockOwnerRoleId, mockTeamId]
            );
            expect(getRowsByColumnValue).toHaveBeenCalledWith(mockDbClient, 'role', 'name', 'owner');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const name = 'Test Account';
            const description = 'Test Description';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await createAccount(userId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(dynamicSendData).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when creating account fails', async () => {
            const userId = 1;
            const name = 'Test Account';
            const description = 'Test Description';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to create account'
            });

            const result = await createAccount(userId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create account');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when creating team fails', async () => {
            const userId = 1;
            const name = 'Test Account';
            const description = 'Test Description';
            const mockAccountId = 10;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockAccountId,
                    message: 'Account created'
                })
                .mockResolvedValueOnce({
                    status: false,
                    data: null,
                    message: 'Failed to create team'
                });

            const result = await createAccount(userId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create team');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when owner role not found', async () => {
            const userId = 1;
            const name = 'Test Account';
            const description = 'Test Description';
            const mockAccountId = 10;
            const mockTeamId = 30;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockAccountId,
                    message: 'Account created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockTeamId,
                    message: 'Team created'
                });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to get role'
            });

            const result = await createAccount(userId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to get role');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when creating user_account fails', async () => {
            const userId = 1;
            const name = 'Test Account';
            const description = 'Test Description';
            const mockAccountId = 10;
            const mockOwnerRoleId = 1;
            const mockTeamId = 30;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockAccountId,
                    message: 'Account created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockTeamId,
                    message: 'Team created'
                })
                .mockResolvedValueOnce({
                    status: false,
                    data: null,
                    message: 'Failed to create user_account'
                });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [{ id: mockOwnerRoleId, name: 'owner' }],
                message: 'Role found'
            });

            const result = await createAccount(userId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create user_account');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const name = 'Test Account';
            const description = 'Test Description';

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await createAccount(userId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('getAccountById', () => {
        it('should return account successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const mockAccount = {
                id: accountId,
                name: 'Test Account',
                description: 'Test Description',
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
                data: mockAccount,
                message: 'Account found'
            });

            const result = await getAccountById(userId, accountId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual(mockAccount);
            expect(result.message).toBe('Account retrieved successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(getRowById).toHaveBeenCalledWith(mockDbClient, 'account', accountId);
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

            const result = await getAccountById(userId, accountId);

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

            const result = await getAccountById(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(getRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when account not found', async () => {
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

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Account not found'
            });

            const result = await getAccountById(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Account not found');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await getAccountById(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('updateAccount', () => {
        it('should update account successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const updateData: UpdateAccountData = {
                name: 'Updated Account',
                description: 'Updated Description'
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

            (updateRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Account updated'
            });

            const result = await updateAccount(userId, accountId, updateData);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Account updated successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(updateRowById).toHaveBeenCalledWith(
                mockDbClient,
                'account',
                Object.keys(updateData),
                Object.values(updateData),
                accountId
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;
            const updateData: UpdateAccountData = { name: 'Updated Account' };

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await updateAccount(userId, accountId, updateData);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(verifyAccountAccess).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;
            const updateData: UpdateAccountData = { name: 'Updated Account' };

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

            const result = await updateAccount(userId, accountId, updateData);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(updateRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when update fails', async () => {
            const userId = 1;
            const accountId = 10;
            const updateData: UpdateAccountData = { name: 'Updated Account' };

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

            (updateRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to update account'
            });

            const result = await updateAccount(userId, accountId, updateData);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to update account');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;
            const updateData: UpdateAccountData = { name: 'Updated Account' };

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await updateAccount(userId, accountId, updateData);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('deleteAccount', () => {
        it('should delete account successfully', async () => {
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

            (verifyAccountRole as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Role verified'
            });

            (deleteRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Account deleted'
            });

            const result = await deleteAccount(userId, accountId);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Account deleted successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(verifyAccountRole).toHaveBeenCalledWith(mockDbClient, userId, accountId, 'owner');
            expect(deleteRowById).toHaveBeenCalledWith(mockDbClient, 'account', accountId);
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

            const result = await deleteAccount(userId, accountId);

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

            const result = await deleteAccount(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(verifyAccountRole).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when user is not owner', async () => {
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

            (verifyAccountRole as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: false,
                message: 'Not owner'
            });

            const result = await deleteAccount(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Only account owners can delete accounts');
            expect(deleteRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when delete fails', async () => {
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

            (verifyAccountRole as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Role verified'
            });

            (deleteRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to delete account'
            });

            const result = await deleteAccount(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to delete account');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await deleteAccount(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });
});

