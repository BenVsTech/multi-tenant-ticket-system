// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { dynamicSendData } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger, generatePassword } from "@/lib/core/helper";
import { sendEmailToUser } from "@/lib/service/email.service";
import { DataReturnObject } from "@/types/helper";

// Exports

export async function createUserAccount(name: string, email: string): Promise<DataReturnObject<boolean>> {

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

        const passwordResult = await generatePassword();
        if(!passwordResult.status || !passwordResult.data) {
            return {
                status: false,
                data: null,
                message: passwordResult.message
            };
        }

        const password = passwordResult.data;

        const sendUserDetailsResult = await dynamicSendData(
            dbClient,
            'users',
            ['name', 'email', 'password'],
            [name, email, password]
        );
        if(!sendUserDetailsResult.status || !sendUserDetailsResult.data) {
            return {
                status: false,
                data: null,
                message: sendUserDetailsResult.message
            };
        }

        const sendEmailResult = await sendEmailToUser(email, 'Welcome to our platform', `Your password is: ${password}`);
        if(!sendEmailResult.status || !sendEmailResult.data) {
            return {
                status: false,
                data: null,
                message: sendEmailResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'User created successfully'
        };

    } catch(error: unknown) {
        logger.error('createUserAccount', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

