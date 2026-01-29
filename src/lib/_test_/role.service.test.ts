// Imports

import { getRoles } from '@/lib/service/role.service';
import { connectToDatabase, DatabaseClient } from '@/lib/core/database';
import { getAllRowsFromTable } from '@/lib/core/database/queries';
import { handleCloseDatabaseConnections } from '@/lib/core/helper';

// Mock all dependencies

jest.mock('@/lib/core/database', () => ({
    connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/core/database/queries', () => ({
    getAllRowsFromTable: jest.fn(),
}));

jest.mock('@/lib/core/helper', () => ({
    handleCloseDatabaseConnections: jest.fn(),
    logger: {
        error: jest.fn(),
    },
}));

// Tests for Role Service

describe('Role Service', () => {
    let mockDbClient: jest.Mocked<DatabaseClient>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDbClient = {
            query: jest.fn(),
            release: jest.fn(),
        } as unknown as jest.Mocked<DatabaseClient>;
    });

    describe('getRoles', () => {
        it('should return roles successfully', async () => {
            const mockRoles = [
                { id: 1, name: 'admin', description: 'Administrator role' },
                { id: 2, name: 'user', description: 'User role' },
                { id: 3, name: 'owner', description: 'Owner role' }
            ];

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getAllRowsFromTable as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockRoles,
                message: 'Roles retrieved'
            });

            const result = await getRoles();

            expect(result.status).toBe(true);
            expect(result.data).toEqual(mockRoles);
            expect(result.message).toBe('Roles retrieved successfully');
            expect(connectToDatabase).toHaveBeenCalledWith(false);
            expect(getAllRowsFromTable).toHaveBeenCalledWith(mockDbClient, 'role');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return empty array when no roles found', async () => {
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getAllRowsFromTable as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'No roles found'
            });

            const result = await getRoles();

            expect(result.status).toBe(true);
            expect(result.data).toEqual([]);
            expect(result.message).toBe('Roles retrieved successfully');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await getRoles();

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(getAllRowsFromTable).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when getAllRowsFromTable fails', async () => {
            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getAllRowsFromTable as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to get roles'
            });

            const result = await getRoles();

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to get roles');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await getRoles();

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });
});

