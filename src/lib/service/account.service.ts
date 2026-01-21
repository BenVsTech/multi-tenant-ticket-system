/// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { dynamicSendData, getRowsByColumnValue } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";

// Exports

export async function createAccount(userId: number, name: string, description: string): Promise<DataReturnObject<boolean>> {

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

        const sendAccountDetailsResult = await dynamicSendData(
            dbClient,
            'account',
            ['name', 'description'],
            [name, description]
        );
        if(!sendAccountDetailsResult.status || !sendAccountDetailsResult.data) {
            return {
                status: false,
                data: null,
                message: sendAccountDetailsResult.message
            };
        }

        const accountId = sendAccountDetailsResult.data;

        const getOwnerRoleResult = await getRowsByColumnValue(dbClient, 'role', 'name', 'owner');
        if(!getOwnerRoleResult.status || !getOwnerRoleResult.data) {
            return {
                status: false,
                data: null,
                message: getOwnerRoleResult.message
            };
        }
        
        const ownerRoleId = getOwnerRoleResult.data[0].id;

        const sendUserAccountResult = await dynamicSendData(
            dbClient,
            'user_account',
            ['user_id', 'account_id', 'role_id'],
            [userId, accountId, ownerRoleId]
        );
        if(!sendUserAccountResult.status || !sendUserAccountResult.data) {
            return {
                status: false,
                data: null,
                message: sendUserAccountResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Account created successfully'
        };

    } catch(error: unknown) {
        logger.error('createAccount', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

