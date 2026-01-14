// Imports

import { createLocalDatabase, createTestUser } from '@/lib/service/database.service';
import { connectToDatabase, closeDatabaseConnection, DatabaseClient } from '@/lib/core/database';
import { checkIfDatabaseExists, createDatabase, createDatabaseSchema, getRowsByColumnValue, dynamicSendData } from '@/lib/core/database/queries';
import { handleCloseDatabaseConnections } from '@/lib/core/helper';
import { databaseConfiguration } from '@/utils/local/db';
import { permissions, roles, rolePermissions } from '@/utils/role';
import { TestUser } from '@/types/database';
import { DataReturnObject } from '@/types/helper';

// Mock all dependencies

jest.mock('@/lib/core/database', () => ({
    connectToDatabase: jest.fn(),
    closeDatabaseConnection: jest.fn(),
}));

jest.mock('@/lib/core/database/queries', () => ({
    checkIfDatabaseExists: jest.fn(),
    createDatabase: jest.fn(),
    createDatabaseSchema: jest.fn(),
    getRowsByColumnValue: jest.fn(),
    dynamicSendData: jest.fn(),
}));

jest.mock('@/lib/core/helper', () => ({
    handleCloseDatabaseConnections: jest.fn(),
}));

jest.mock('@/utils/local/db', () => ({
    databaseConfiguration: {
        name: 'mt_ticket_system',
        globalTriggerFunctions: [],
        tables: [],
    },
}));

jest.mock('@/utils/role', () => ({
    permissions: [],
    roles: [],
    rolePermissions: [],
}));

// Tests for Database Service

describe('Database Service', () => {
    let mockDbClient: jest.Mocked<DatabaseClient>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDbClient = {
            query: jest.fn(),
            release: jest.fn(),
        } as unknown as jest.Mocked<DatabaseClient>;
    });

    describe('createLocalDatabase', () => {
        it('should return success when database already exists', async () => {
            const mockTemporaryDbClient = { ...mockDbClient };
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTemporaryDbClient,
                message: 'Connected to database'
            });
            (checkIfDatabaseExists as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Database exists'
            });

            const result = await createLocalDatabase();

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Database already exists');
            expect(connectToDatabase).toHaveBeenCalledWith(true);
            expect(checkIfDatabaseExists).toHaveBeenCalledWith(mockTemporaryDbClient, databaseConfiguration.name);
            expect(createDatabase).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(mockTemporaryDbClient, null);
        });

        it('should create database successfully when it does not exist', async () => {
            const mockTemporaryDbClient = { ...mockDbClient };
            const mockMainDbClient = { ...mockDbClient };
            
            (connectToDatabase as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockTemporaryDbClient,
                    message: 'Connected to temporary database'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockMainDbClient,
                    message: 'Connected to main database'
                });
            
            (checkIfDatabaseExists as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: false,
                message: 'Database does not exist'
            });
            
            (createDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Database created'
            });
            
            (closeDatabaseConnection as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: null,
                message: 'Connection closed'
            });
            
            (createDatabaseSchema as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Schema created'
            });

            const result = await createLocalDatabase();

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Database Created Successfully');
            expect(connectToDatabase).toHaveBeenCalledTimes(2);
            expect(connectToDatabase).toHaveBeenNthCalledWith(1, true);
            expect(connectToDatabase).toHaveBeenNthCalledWith(2, false);
            expect(checkIfDatabaseExists).toHaveBeenCalledWith(mockTemporaryDbClient, databaseConfiguration.name);
            expect(createDatabase).toHaveBeenCalledWith(mockTemporaryDbClient, databaseConfiguration.name);
            expect(closeDatabaseConnection).toHaveBeenCalledWith(mockTemporaryDbClient);
            expect(createDatabaseSchema).toHaveBeenCalledWith(
                mockMainDbClient,
                databaseConfiguration,
                permissions,
                roles,
                rolePermissions
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(mockTemporaryDbClient, mockMainDbClient);
        });

        it('should return error when temporary database connection fails', async () => {
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await createLocalDatabase();

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(connectToDatabase).toHaveBeenCalledWith(true);
            expect(checkIfDatabaseExists).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when checkIfDatabaseExists fails', async () => {    
            const mockTemporaryDbClient = { ...mockDbClient };
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTemporaryDbClient,
                message: 'Connected to database'
            });
            (checkIfDatabaseExists as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Error checking database'
            });

            const result = await createLocalDatabase();

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Error checking database');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(mockTemporaryDbClient, null);
        });

        it('should return error when createDatabase fails', async () => {
            const mockTemporaryDbClient = { ...mockDbClient };
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTemporaryDbClient,
                message: 'Connected to database'
            });
            (checkIfDatabaseExists as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: false,
                message: 'Database does not exist'
            });
            (createDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to create database'
            });

            const result = await createLocalDatabase();

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create database');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(mockTemporaryDbClient, null);
        });

        it('should return error when closing temporary connection fails', async () => {
            const mockTemporaryDbClient = { ...mockDbClient };
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTemporaryDbClient,
                message: 'Connected to database'
            });
            (checkIfDatabaseExists as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: false,
                message: 'Database does not exist'
            });
            (createDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Database created'
            });
            (closeDatabaseConnection as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to close connection'
            });

            const result = await createLocalDatabase();

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to close connection');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(mockTemporaryDbClient, null);
        });

        it('should return error when main database connection fails', async () => {
            const mockTemporaryDbClient = { ...mockDbClient };
            (connectToDatabase as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockTemporaryDbClient,
                    message: 'Connected to temporary database'
                })
                .mockResolvedValueOnce({
                    status: false,
                    data: null,
                    message: 'Failed to connect to main database'
                });
            (checkIfDatabaseExists as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: false,
                message: 'Database does not exist'
            });
            (createDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Database created'
            });
            (closeDatabaseConnection as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: null,
                message: 'Connection closed'
            });

            const result = await createLocalDatabase();

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to connect to main database');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(mockTemporaryDbClient, null);
        });

        it('should return error when createDatabaseSchema fails', async () => {
            const mockTemporaryDbClient = { ...mockDbClient };
            const mockMainDbClient = { ...mockDbClient };
            (connectToDatabase as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockTemporaryDbClient,
                    message: 'Connected to temporary database'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockMainDbClient,
                    message: 'Connected to main database'
                });
            (checkIfDatabaseExists as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: false,
                message: 'Database does not exist'
            });
            (createDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Database created'
            });
            (closeDatabaseConnection as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: null,
                message: 'Connection closed'
            });
            (createDatabaseSchema as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to create schema'
            });

            const result = await createLocalDatabase();

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create schema');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(mockTemporaryDbClient, mockMainDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            // Arrange
            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            // Act
            const result = await createLocalDatabase();

            // Assert
            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Unexpected error');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('createTestUser', () => {
        const mockTestUser: TestUser = {
            details: {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            },
            account: {
                name: 'Test Account',
                description: 'Test Description'
            },
            role: {
                name: 'admin'
            }
        };

        it('should create test user successfully', async () => {
            // Arrange
            const mockRoleId = 1;
            const mockUserId = 10;
            const mockAccountId = 20;
            
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });
            
            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockUserId,
                    message: 'User created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockAccountId,
                    message: 'Account created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: 30,
                    message: 'User account created'
                });
            
            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [{ id: mockRoleId, name: 'admin' }],
                message: 'Role found'
            });

            const result = await createTestUser(mockTestUser);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Test user created successfully');
            expect(connectToDatabase).toHaveBeenCalledWith(false);
            expect(dynamicSendData).toHaveBeenCalledTimes(3);
            expect(dynamicSendData).toHaveBeenNthCalledWith(
                1,
                mockDbClient,
                'users',
                ['name', 'email', 'password'],
                [mockTestUser.details.name, mockTestUser.details.email, mockTestUser.details.password]
            );
            expect(dynamicSendData).toHaveBeenNthCalledWith(
                2,
                mockDbClient,
                'account',
                ['name', 'description'],
                [mockTestUser.account.name, mockTestUser.account.description]
            );
            expect(dynamicSendData).toHaveBeenNthCalledWith(
                3,
                mockDbClient,
                'user_account',
                ['user_id', 'account_id', 'role_id'],
                [mockUserId, mockAccountId, mockRoleId]
            );
            expect(getRowsByColumnValue).toHaveBeenCalledWith(mockDbClient, 'role', 'name', mockTestUser.role.name);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await createTestUser(mockTestUser);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(dynamicSendData).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when creating user fails', async () => {
            // Arrange
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });
            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to create user'
            });

            const result = await createTestUser(mockTestUser);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create user');
            expect(dynamicSendData).toHaveBeenCalledTimes(1);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when creating account fails', async () => {
            // Arrange
            const mockUserId = 10;
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });
            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockUserId,
                    message: 'User created'
                })
                .mockResolvedValueOnce({
                    status: false,
                    data: null,
                    message: 'Failed to create account'
                });

            const result = await createTestUser(mockTestUser);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create account');
            expect(dynamicSendData).toHaveBeenCalledTimes(2);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when role is not found', async () => {
            const mockUserId = 10;
            const mockAccountId = 20;
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });
            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockUserId,
                    message: 'User created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockAccountId,
                    message: 'Account created'
                });
            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'Role not found'
            });

            const result = await createTestUser(mockTestUser);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Role not found');
            expect(getRowsByColumnValue).toHaveBeenCalledWith(mockDbClient, 'role', 'name', mockTestUser.role.name);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when getRowsByColumnValue fails', async () => {
            const mockUserId = 10;
            const mockAccountId = 20;
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });
            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockUserId,
                    message: 'User created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockAccountId,
                    message: 'Account created'
                });
            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to get role'
            });

            const result = await createTestUser(mockTestUser);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to get role');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when creating user_account fails', async () => {
            const mockUserId = 10;
            const mockAccountId = 20;
            const mockRoleId = 1;
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });
            (dynamicSendData as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockUserId,
                    message: 'User created'
                })
                .mockResolvedValueOnce({
                    status: true,
                    data: mockAccountId,
                    message: 'Account created'
                })
                .mockResolvedValueOnce({
                    status: false,
                    data: null,
                    message: 'Failed to create user_account'
                });
            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [{ id: mockRoleId, name: 'admin' }],
                message: 'Role found'
            });

            const result = await createTestUser(mockTestUser);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create user_account');
            expect(dynamicSendData).toHaveBeenCalledTimes(3);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await createTestUser(mockTestUser);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Unexpected error');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });
});