// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { getAllRowsFromTable } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";

// Exports

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

