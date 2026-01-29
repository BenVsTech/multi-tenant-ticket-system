// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { getAllRowsFromTable } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";

// Exports

export async function getRoles(): Promise<DataReturnObject<{id: number, name: string, description: string}[]>> {

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

        const getRolesResult = await getAllRowsFromTable(dbClient, 'role');
        if(!getRolesResult.status || !getRolesResult.data) {
            return {
                status: false,
                data: null,
                message: getRolesResult.message
            };
        }

        return {
            status: true,
            data: getRolesResult.data as {id: number, name: string, description: string}[],
            message: 'Roles retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getRoles', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

