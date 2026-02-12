// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { getAllRowsFromTable, getRowById, deleteRowById, dynamicSendData, updateRowById, getRowsByColumnValue } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger, formatDate } from "@/lib/core/helper";
import { verifyAccountAccess } from "@/lib/core/validation";
import { DataReturnObject } from "@/types/helper";

// Exports

export async function getTeamsForOptions(userId: number, accountId: number): Promise<DataReturnObject<{id: number, name: string}[]>> {

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

        const getTeamsResult = await getAllRowsFromTable(dbClient, 'team', accountId);
        if(!getTeamsResult.status || !getTeamsResult.data) {
            return {
                status: false,
                data: null,
                message: getTeamsResult.message
            };
        }

        const teams = getTeamsResult.data;

        const teamsForOptions = teams.map((team: any) => ({
            id: team.id,
            name: team.name
        }));

        return {
            status: true,
            data: teamsForOptions,
            message: 'Teams retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getTeamsForOptions', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function getTeamById(userId: number, accountId: number, teamId: number): Promise<DataReturnObject<{name: string, description: string}>> {

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

        const teamResult = await getRowById(dbClient, 'team', teamId, accountId);
        if(!teamResult.status || !teamResult.data) {
            return {
                status: false,
                data: null,
                message: 'Team not found'
            };
        }

        const teamName = teamResult.data.name;
        const teamDescription = teamResult.data.description;

        if(typeof teamName !== 'string' || typeof teamDescription !== 'string') {
            return {
                status: false,
                data: null,
                message: 'Invalid team data'
            };
        }

        return {
            status: true,
            data: {
                name: teamName,
                description: teamDescription
            },
            message: 'Team retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getTeamById', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function getTeams(accountId: number): Promise<DataReturnObject<{id: number, name: string, description: string}[]>> {

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

        const getTeamsResult = await getAllRowsFromTable(dbClient, 'team', accountId);
        if(!getTeamsResult.status || !getTeamsResult.data) {
            return {
                status: false,
                data: null,
                message: getTeamsResult.message
            };
        }

        return {
            status: true,
            data: getTeamsResult.data as {id: number, name: string, description: string}[],
            message: 'Teams retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getTeams', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function getAllTeams(userId: number, accountId: number): Promise<DataReturnObject<string[][]>> {

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

        const getTeamsResult = await getAllRowsFromTable(dbClient, 'team', accountId);
        if(!getTeamsResult.status || !getTeamsResult.data) {
            return {
                status: false,
                data: null,
                message: getTeamsResult.message
            };
        }

        const teams = getTeamsResult.data;

        if(teams.length === 0) {
            return {
                status: true,
                data: [],
                message: 'No teams found for this account'
            };
        }

        const teamsResult = await Promise.all(teams.map(async (team: any) => {
            return [
                team.id.toString(),
                team.name,
                await formatDate(team.updated_at),
                await formatDate(team.created_at)
            ];
        }));

        return {
            status: true,
            data: teamsResult,
            message: 'Teams retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getAllTeams', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function createTeam(userId: number, accountId: number, name: string, description: string): Promise<DataReturnObject<boolean>> {

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

        const createTeamResult = await dynamicSendData(
            dbClient,
            'team',
            ['name', 'description', 'account_id'],
            [name, description, accountId]
        );
        if(!createTeamResult.status || !createTeamResult.data) {
            return {
                status: false,
                data: null,
                message: createTeamResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Team created successfully'
        };

    } catch(error: unknown) {
        logger.error('createTeam', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function updateTeam(userId: number, accountId: number, teamId: number, name?: string, description?: string): Promise<DataReturnObject<boolean>> {

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

        const teamResult = await getRowById(dbClient, 'team', teamId, accountId);
        if(!teamResult.status || !teamResult.data) {
            return {
                status: false,
                data: null,
                message: 'Team not found'
            };
        }

        const updateData: { name?: string; description?: string } = {};
        if(name !== undefined) updateData.name = name;
        if(description !== undefined) updateData.description = description;

        if(Object.keys(updateData).length === 0) {
            return {
                status: false,
                data: null,
                message: 'No fields to update'
            };
        }

        const updateDataColumns = Object.keys(updateData);
        const updateDataValues = Object.values(updateData);

        const updateTeamResult = await updateRowById(
            dbClient,
            'team',
            updateDataColumns,
            updateDataValues,
            teamId,
            accountId
        );
        if(!updateTeamResult.status || !updateTeamResult.data) {
            return {
                status: false,
                data: null,
                message: updateTeamResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Team updated successfully'
        };

    } catch(error: unknown) {
        logger.error('updateTeam', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function deleteTeam(userId: number, accountId: number, teamId: number): Promise<DataReturnObject<boolean>> {

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

        const teamResult = await getRowById(dbClient, 'team', teamId, accountId);
        if(!teamResult.status || !teamResult.data) {
            return {
                status: false,
                data: null,
                message: 'Team not found'
            };
        }

        const getUsersInTeamResult = await getRowsByColumnValue(dbClient, 'user_account', 'team_id', teamId.toString());
        if(!getUsersInTeamResult.status || !getUsersInTeamResult.data || getUsersInTeamResult.data.length > 0) {
            return {
                status: false,
                data: null,
                message: 'Team has users assigned to it'
            };
        }

        const deleteResult = await deleteRowById(dbClient, 'team', teamId, accountId);
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
            message: 'Team deleted successfully'
        };

    } catch(error: unknown) {
        logger.error('deleteTeam', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

