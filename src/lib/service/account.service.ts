/// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { dynamicSendData, getRowsByColumnValue, getStringRowsAccounts, updateRowById, getRowById, deleteRowById } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";

// Exports

export async function getAccounts(userId: number): Promise<DataReturnObject<string[][]>> {

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

        const getAccountsResult = await getStringRowsAccounts(dbClient, userId);
        if(!getAccountsResult.status || !getAccountsResult.data) {
            return {
                status: false,
                data: null,
                message: getAccountsResult.message
            };
        }

        return {
            status: true,
            data: getAccountsResult.data,
            message: getAccountsResult.message
        };

    } catch(error: unknown) {
        logger.error('getAccounts', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

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

export async function getAccountById(userId: number, accountId: number): Promise<DataReturnObject<{id: number, name: string, description: string, created_at: Date, updated_at: Date}>> {

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

        const getAccountResult = await getRowById(dbClient, 'account', accountId);
        if(!getAccountResult.status || !getAccountResult.data) {
            return {
                status: false,
                data: null,
                message: getAccountResult.message
            };
        }

        return {
            status: true,
            data: getAccountResult.data,
            message: 'Account retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getAccountById', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function updateAccount(accountId: number, data: any): Promise<DataReturnObject<boolean>> {

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

        const keys = Object.keys(data);
        const values = Object.values(data);

        const updateAccountResult = await updateRowById(dbClient, 'account', keys, values, accountId);
        if(!updateAccountResult.status || !updateAccountResult.data) {
            return {
                status: false,
                data: null,
                message: updateAccountResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Account updated successfully'
        };

    } catch(error: unknown) {
        logger.error('updateAccount', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function deleteAccount(accountId: number): Promise<DataReturnObject<boolean>> {

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

        const deleteAccountResult = await deleteRowById(dbClient, 'account', accountId);
        if(!deleteAccountResult.status || !deleteAccountResult.data) {
            return {
                status: false,
                data: null,
                message: deleteAccountResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Account deleted successfully'
        };

    } catch(error: unknown) {
        logger.error('deleteAccount', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

