// Imports

import { databaseConfiguration } from "@/utils/local/db";
import { connectToDatabase, closeDatabaseConnection, DatabaseClient } from "@/lib/core/database";
import { DataReturnObject } from "@/types/helper";
import { handleCloseDatabaseConnections } from "@/lib/core/helper";
import { TestUser } from "@/types/database";
import { checkIfDatabaseExists, createDatabase, createDatabaseSchema, getRowsByColumnValue } from "@/lib/core/database/queries";
import { permissions, roles, rolePermissions } from "@/utils/role";
import { dynamicSendData } from "@/lib/core/database/queries";

// Export services

export async function createLocalDatabase(): Promise<DataReturnObject<boolean>> {
    
    let temporaryDbClient: DatabaseClient | null = null;
    let dbClient: DatabaseClient | null = null;

    try{
        const temporaryDbConnection = await connectToDatabase(true);

        if(!temporaryDbConnection.status || !temporaryDbConnection.data) {
            return {
                status: false,
                data: null,
                message: temporaryDbConnection.message
            };
        }

        temporaryDbClient = temporaryDbConnection.data;

        const databaseExists = await checkIfDatabaseExists(temporaryDbClient, databaseConfiguration.name);

        if(!databaseExists.status) {
            return {
                status: false,
                data: null,
                message: databaseExists.message
            };
        }

        if(databaseExists.data) {
            return {
                status: true,
                data: true,
                message: 'Database already exists'
            };
        }

        const createDatabaseResult = await createDatabase(temporaryDbClient, databaseConfiguration.name);
        if(!createDatabaseResult.status) {
            return {
                status: false,
                data: null,
                message: createDatabaseResult.message
            };
        }

        const closeTemporaryDatabaseConnection = await closeDatabaseConnection(temporaryDbClient);
        if(!closeTemporaryDatabaseConnection.status) {
            return {
                status: false,
                data: null,
                message: closeTemporaryDatabaseConnection.message
            };
        }

        const databaseConnection = await connectToDatabase(false);
        if(!databaseConnection.status || !databaseConnection.data) {
            return {
                status: false,
                data: null,
                message: databaseConnection.message
            };
        }

        dbClient = databaseConnection.data;

        const createDatabaseSchemaResult = await createDatabaseSchema(
            dbClient, 
            databaseConfiguration, 
            permissions, 
            roles, 
            rolePermissions
        );
        if(!createDatabaseSchemaResult.status) {
            return {
                status: false,
                data: null,
                message: createDatabaseSchemaResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Database Created Successfully'
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while creating local database'
        };
    } finally{
        await handleCloseDatabaseConnections(temporaryDbClient, dbClient);
    }
}

export async function createTestUser(user: TestUser): Promise<DataReturnObject<boolean>> {

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

        const sendUserDetailsResult = await dynamicSendData(
            dbClient, 
            'users', 
            ['name', 'email', 'password'], 
            [user.details.name, user.details.email, user.details.password]
        );
        if(!sendUserDetailsResult.status || !sendUserDetailsResult.data) {
            return {
                status: false,
                data: null,
                message: sendUserDetailsResult.message
            };
        }

        const userId = sendUserDetailsResult.data;

        const sendAccountDetailsResult = await dynamicSendData(
            dbClient, 
            'account', 
            ['name', 'description'], 
            [user.account.name, user.account.description]
        );
        if(!sendAccountDetailsResult.status || !sendAccountDetailsResult.data) {
            return {
                status: false,
                data: null,
                message: sendAccountDetailsResult.message
            };
        }

        const accountId = sendAccountDetailsResult.data;

        const getRoleResult = await getRowsByColumnValue(dbClient, 'role', 'name', user.role.name);
        if(!getRoleResult.status || !getRoleResult.data) {
            return {
                status: false,
                data: null,
                message: getRoleResult.message
            };
        }

        if(getRoleResult.data.length === 0) {
            return {
                status: false,
                data: null,
                message: 'Role not found'
            };
        }

        const roleId = getRoleResult.data[0].id;

        const sendUserAccountResult = await dynamicSendData(
            dbClient, 
            'user_account', 
            ['user_id', 'account_id', 'role_id'], 
            [userId, accountId, roleId]
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
            message: 'Test user created successfully'
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while creating test user'
        };
    }
    finally{
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

