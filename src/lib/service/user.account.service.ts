// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { checkPassword, dynamicSendData, getRowById, getRowsByColumnValue, updateRowById } from "@/lib/core/database/queries";
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

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await getRowsByColumnValue(dbClient, 'users', 'email', normalizedEmail);
        if (existingUser.status && existingUser.data && existingUser.data.length > 0) {
            return {
                status: false,
                message: 'An account with this email already exists. If this is your account, please try logging in or resetting your password.',
                data: null
            };
        }

        const sendUserDetailsResult = await dynamicSendData(
            dbClient,
            'users',
            ['name', 'email', 'password', 'must_change_password'],
            [name, normalizedEmail, password, true]
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

export async function changeUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<DataReturnObject<boolean>> {
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

        const userResult = await getRowById(dbClient, 'users', userId);
        if (!userResult.status || !userResult.data) {
            return {
                status: false,
                message: 'User not found',
                data: null
            };
        }

        const passwordCheck = await checkPassword(dbClient, userResult.data.email, currentPassword);
        if (!passwordCheck.status || !passwordCheck.data) {
            return {
                status: false,
                message: 'Current password is incorrect',
                data: null
            };
        }

        const updateResult = await updateRowById(
            dbClient,
            'users',
            ['password', 'must_change_password'],
            [newPassword, false],
            userId
        );

        if (!updateResult.status) {
            return {
                status: false,
                message: updateResult.message,
                data: null
            };
        }

        return {
            status: true,
            message: 'Password changed successfully',
            data: true
        };

    } catch(error: unknown) {

        logger.error('changeUserPassword', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
        
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

