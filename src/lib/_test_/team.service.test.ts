// Imports

import { getTeamsForOptions, getTeamById, getTeams, getAllTeams, createTeam, updateTeam, deleteTeam } from '@/lib/service/team.service';
import { connectToDatabase, DatabaseClient } from '@/lib/core/database';
import { getAllRowsFromTable, getRowById, deleteRowById, dynamicSendData, updateRowById, getRowsByColumnValue } from '@/lib/core/database/queries';
import { handleCloseDatabaseConnections, formatDate } from '@/lib/core/helper';
import { verifyAccountAccess } from '@/lib/core/validation';

// Mock all dependencies

jest.mock('@/lib/core/database', () => ({
    connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/core/database/queries', () => ({
    getAllRowsFromTable: jest.fn(),
    getRowById: jest.fn(),
    deleteRowById: jest.fn(),
    dynamicSendData: jest.fn(),
    updateRowById: jest.fn(),
    getRowsByColumnValue: jest.fn(),
}));

jest.mock('@/lib/core/helper', () => ({
    handleCloseDatabaseConnections: jest.fn(),
    formatDate: jest.fn(),
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('@/lib/core/validation', () => ({
    verifyAccountAccess: jest.fn(),
}));

// Tests for Team Service

describe('Team Service', () => {
    let mockDbClient: jest.Mocked<DatabaseClient>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDbClient = {
            query: jest.fn(),
            release: jest.fn(),
        } as unknown as jest.Mocked<DatabaseClient>;
    });

    describe('getTeamsForOptions', () => {
        it('should return teams for options successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const mockTeams = [
                { id: 1, name: 'Team 1', description: 'Description 1', account_id: accountId },
                { id: 2, name: 'Team 2', description: 'Description 2', account_id: accountId }
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

            (getAllRowsFromTable as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTeams,
                message: 'Teams retrieved'
            });

            const result = await getTeamsForOptions(userId, accountId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([
                { id: 1, name: 'Team 1' },
                { id: 2, name: 'Team 2' }
            ]);
            expect(result.message).toBe('Teams retrieved successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(getAllRowsFromTable).toHaveBeenCalledWith(mockDbClient, 'team', accountId);
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

            const result = await getTeamsForOptions(userId, accountId);

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

            const result = await getTeamsForOptions(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(getAllRowsFromTable).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when getAllRowsFromTable fails', async () => {
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

            (getAllRowsFromTable as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to get teams'
            });

            const result = await getTeamsForOptions(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to get teams');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await getTeamsForOptions(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('getTeamById', () => {
        it('should return team successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const mockTeam = {
                id: teamId,
                name: 'Test Team',
                description: 'Test Description',
                account_id: accountId
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
                data: mockTeam,
                message: 'Team found'
            });

            const result = await getTeamById(userId, accountId, teamId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual({
                name: 'Test Team',
                description: 'Test Description'
            });
            expect(result.message).toBe('Team retrieved successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(getRowById).toHaveBeenCalledWith(mockDbClient, 'team', teamId, accountId);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await getTeamById(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(verifyAccountAccess).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;

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

            const result = await getTeamById(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(getRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when team not found', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;

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
                message: 'Team not found'
            });

            const result = await getTeamById(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Team not found');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when team data is invalid', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const mockTeam = {
                id: teamId,
                name: null,
                description: 'Test Description',
                account_id: accountId
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
                data: mockTeam,
                message: 'Team found'
            });

            const result = await getTeamById(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Invalid team data');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await getTeamById(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('getTeams', () => {
        it('should return teams successfully', async () => {
            const accountId = 10;
            const mockTeams = [
                { id: 1, name: 'Team 1', description: 'Description 1' },
                { id: 2, name: 'Team 2', description: 'Description 2' }
            ];

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getAllRowsFromTable as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTeams,
                message: 'Teams retrieved'
            });

            const result = await getTeams(accountId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual(mockTeams);
            expect(result.message).toBe('Teams retrieved successfully');
            expect(getAllRowsFromTable).toHaveBeenCalledWith(mockDbClient, 'team', accountId);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const accountId = 10;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await getTeams(accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(getAllRowsFromTable).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when getAllRowsFromTable fails', async () => {
            const accountId = 10;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getAllRowsFromTable as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to get teams'
            });

            const result = await getTeams(accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to get teams');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const accountId = 10;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await getTeams(accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('getAllTeams', () => {
        it('should return all teams successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const mockTeams = [
                {
                    id: 1,
                    name: 'Team 1',
                    description: 'Description 1',
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date('2024-01-01')
                },
                {
                    id: 2,
                    name: 'Team 2',
                    description: 'Description 2',
                    created_at: new Date('2024-01-02'),
                    updated_at: new Date('2024-01-02')
                }
            ];
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

            (getAllRowsFromTable as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTeams,
                message: 'Teams retrieved'
            });

            (formatDate as jest.Mock)
                .mockResolvedValueOnce(mockFormattedDate)
                .mockResolvedValueOnce(mockFormattedDate)
                .mockResolvedValueOnce(mockFormattedDate)
                .mockResolvedValueOnce(mockFormattedDate);

            const result = await getAllTeams(userId, accountId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([
                ['1', 'Team 1', 'Description 1', mockFormattedDate, mockFormattedDate],
                ['2', 'Team 2', 'Description 2', mockFormattedDate, mockFormattedDate]
            ]);
            expect(result.message).toBe('Teams retrieved successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(getAllRowsFromTable).toHaveBeenCalledWith(mockDbClient, 'team', accountId);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return empty array when no teams found', async () => {
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

            (getAllRowsFromTable as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'No teams found'
            });

            const result = await getAllTeams(userId, accountId);

            expect(result.status).toBe(true);
            expect(result.data).toEqual([]);
            expect(result.message).toBe('No teams found for this account');
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

            const result = await getAllTeams(userId, accountId);

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

            const result = await getAllTeams(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(getAllRowsFromTable).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await getAllTeams(userId, accountId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('createTeam', () => {
        it('should create team successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test Team';
            const description = 'Test Description';

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
                data: 20,
                message: 'Team created'
            });

            const result = await createTeam(userId, accountId, name, description);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Team created successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(dynamicSendData).toHaveBeenCalledWith(
                mockDbClient,
                'team',
                ['name', 'description', 'account_id'],
                [name, description, accountId]
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test Team';
            const description = 'Test Description';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await createTeam(userId, accountId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(verifyAccountAccess).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test Team';
            const description = 'Test Description';

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

            const result = await createTeam(userId, accountId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(dynamicSendData).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when creating team fails', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test Team';
            const description = 'Test Description';

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
                message: 'Failed to create team'
            });

            const result = await createTeam(userId, accountId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create team');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;
            const name = 'Test Team';
            const description = 'Test Description';

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await createTeam(userId, accountId, name, description);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('updateTeam', () => {
        it('should update team successfully with name and description', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const name = 'Updated Team';
            const description = 'Updated Description';
            const mockTeam = {
                id: teamId,
                name: 'Old Team',
                description: 'Old Description',
                account_id: accountId
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
                data: mockTeam,
                message: 'Team found'
            });

            (updateRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Team updated'
            });

            const result = await updateTeam(userId, accountId, teamId, name, description);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Team updated successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(getRowById).toHaveBeenCalledWith(mockDbClient, 'team', teamId, accountId);
            expect(updateRowById).toHaveBeenCalledWith(
                mockDbClient,
                'team',
                ['name', 'description'],
                [name, description],
                teamId,
                accountId
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should update team successfully with only name', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const name = 'Updated Team';
            const mockTeam = {
                id: teamId,
                name: 'Old Team',
                description: 'Old Description',
                account_id: accountId
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
                data: mockTeam,
                message: 'Team found'
            });

            (updateRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Team updated'
            });

            const result = await updateTeam(userId, accountId, teamId, name);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Team updated successfully');
            expect(updateRowById).toHaveBeenCalledWith(
                mockDbClient,
                'team',
                ['name'],
                [name],
                teamId,
                accountId
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when no fields to update', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const mockTeam = {
                id: teamId,
                name: 'Old Team',
                description: 'Old Description',
                account_id: accountId
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
                data: mockTeam,
                message: 'Team found'
            });

            const result = await updateTeam(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('No fields to update');
            expect(updateRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const name = 'Updated Team';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await updateTeam(userId, accountId, teamId, name);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(verifyAccountAccess).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const name = 'Updated Team';

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

            const result = await updateTeam(userId, accountId, teamId, name);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(getRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when team not found', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const name = 'Updated Team';

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
                message: 'Team not found'
            });

            const result = await updateTeam(userId, accountId, teamId, name);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Team not found');
            expect(updateRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when update fails', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const name = 'Updated Team';
            const mockTeam = {
                id: teamId,
                name: 'Old Team',
                description: 'Old Description',
                account_id: accountId
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
                data: mockTeam,
                message: 'Team found'
            });

            (updateRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to update team'
            });

            const result = await updateTeam(userId, accountId, teamId, name);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to update team');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const name = 'Updated Team';

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await updateTeam(userId, accountId, teamId, name);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('deleteTeam', () => {
        it('should delete team successfully', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const mockTeam = {
                id: teamId,
                name: 'Test Team',
                description: 'Test Description',
                account_id: accountId
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

            (getRowById as jest.Mock)
                .mockResolvedValueOnce({
                    status: true,
                    data: mockTeam,
                    message: 'Team found'
                });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'No users in team'
            });

            (deleteRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Team deleted'
            });

            const result = await deleteTeam(userId, accountId, teamId);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Team deleted successfully');
            expect(verifyAccountAccess).toHaveBeenCalledWith(mockDbClient, userId, accountId);
            expect(getRowById).toHaveBeenCalledWith(mockDbClient, 'team', teamId, accountId);
            expect(getRowsByColumnValue).toHaveBeenCalledWith(mockDbClient, 'user_account', 'team_id', teamId.toString());
            expect(deleteRowById).toHaveBeenCalledWith(mockDbClient, 'team', teamId, accountId);
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await deleteTeam(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(verifyAccountAccess).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user does not have access', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;

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

            const result = await deleteTeam(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('You do not have access to this account');
            expect(getRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when team not found', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;

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
                message: 'Team not found'
            });

            const result = await deleteTeam(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Team not found');
            expect(getRowsByColumnValue).not.toHaveBeenCalled();
            expect(deleteRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when team has users assigned', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const mockTeam = {
                id: teamId,
                name: 'Test Team',
                description: 'Test Description',
                account_id: accountId
            };
            const mockUsers = [
                { id: 1, user_id: 10, team_id: teamId }
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

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTeam,
                message: 'Team found'
            });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUsers,
                message: 'Users found'
            });

            const result = await deleteTeam(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Team has users assigned to it');
            expect(deleteRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when getRowsByColumnValue fails', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const mockTeam = {
                id: teamId,
                name: 'Test Team',
                description: 'Test Description',
                account_id: accountId
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
                data: mockTeam,
                message: 'Team found'
            });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to get users'
            });

            const result = await deleteTeam(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Team has users assigned to it');
            expect(deleteRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when delete fails', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;
            const mockTeam = {
                id: teamId,
                name: 'Test Team',
                description: 'Test Description',
                account_id: accountId
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
                data: mockTeam,
                message: 'Team found'
            });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'No users in team'
            });

            (deleteRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to delete team'
            });

            const result = await deleteTeam(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to delete team');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const accountId = 10;
            const teamId = 5;

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await deleteTeam(userId, accountId, teamId);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });
});

