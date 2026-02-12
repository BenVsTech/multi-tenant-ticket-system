// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { getPerformanceDataByAccount } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger } from "@/lib/core/helper";
import { verifyAccountAccess } from "@/lib/core/validation";
import { DataReturnObject } from "@/types/helper";
import { PerformanceApiData } from "@/types/component";

// Exports

export async function getPerformanceData(userId: number, accountId: number): Promise<DataReturnObject<PerformanceApiData>> {

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

        const performanceDataResult = await getPerformanceDataByAccount(dbClient, accountId);
        if(!performanceDataResult.status || !performanceDataResult.data) {
            return {
                status: false,
                data: null,
                message: performanceDataResult.message
            };
        }

        return {
            status: true,
            data: performanceDataResult.data,
            message: performanceDataResult.message
        };

    } catch(error: unknown) {
        logger.error('getPerformanceData', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}
