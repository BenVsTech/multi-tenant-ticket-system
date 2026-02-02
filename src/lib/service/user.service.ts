// Imports

import { connectToDatabase, DatabaseClient } from "@/lib/core/database";
import { dynamicSendData, getRowsByColumnValue, getRowById, deleteRowById } from "@/lib/core/database/queries";
import { handleCloseDatabaseConnections, logger, generatePassword, formatDate } from "@/lib/core/helper";
import { verifyAccountAccess } from "@/lib/core/validation";
import { sendEmailToUser } from "@/lib/service/email.service";
import { DataReturnObject } from "@/types/helper";
import { UserAccountRow } from "@/types/component";

// Exports

export async function getUsersForOptions(userId: number, accountId: number): Promise<DataReturnObject<{id: number, name: string}[]>> {

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

        const userAccountsQuery = await dbClient.query(
            `SELECT * FROM user_account WHERE account_id = $1 ORDER BY created_at DESC`,
            [accountId]
        );
        
        const userAccounts = userAccountsQuery.rows || [];

        if(userAccounts.length === 0) {
            return {
                status: true,
                data: [],
                message: 'No users found for this account'
            };
        }

        const usersResult = await Promise.all(userAccounts.map(async (userAccount: UserAccountRow) => {
            const userResult = await getRowById(dbClient!, 'users', userAccount.user_id);
            if(!userResult.status || !userResult.data) {
                return null;
            }

            return {
                id: userAccount.user_id,
                name: userResult.data.name
            };
        }));

        if(usersResult.some((user) => user === null)) {
            return {
                status: false,
                data: null,
                message: 'Failed to retrieve some user information'
            };
        }

        const users = usersResult.filter((user) => user !== null) as {id: number, name: string}[];

        return {
            status: true,
            data: users,
            message: 'Users retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getUsersForOptions', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function getAllUsers(userId: number, accountId: number): Promise<DataReturnObject<string[][]>> {

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

        const userAccountsQuery = await dbClient.query(
            `SELECT * FROM user_account WHERE account_id = $1 ORDER BY created_at DESC`,
            [accountId]
        );
        
        const userAccounts = userAccountsQuery.rows || [];

        if(userAccounts.length === 0) {
            return {
                status: true,
                data: [],
                message: 'No users found for this account'
            };
        }

        const usersResult = await Promise.all(userAccounts.map(async (userAccount: UserAccountRow) => {
            const userResult = await getRowById(dbClient!, 'users', userAccount.user_id);
            if(!userResult.status || !userResult.data) {
                return null;
            }

            const roleResult = await getRowById(dbClient!, 'role', userAccount.role_id);
            if(!roleResult.status || !roleResult.data) {
                return null;
            }

            return [
                userAccount.id.toString(),
                userResult.data.name,
                userResult.data.email,
                roleResult.data.name,
                await formatDate(userAccount.updated_at),
                await formatDate(userAccount.created_at)
            ];
        }));

        if(usersResult.some((user) => user === null)) {
            return {
                status: false,
                data: null,
                message: 'Failed to retrieve some user information'
            };
        }

        const users = usersResult.filter((user) => user !== null) as string[][];

        return {
            status: true,
            data: users,
            message: 'Users retrieved successfully'
        };

    } catch(error: unknown) {
        logger.error('getAllUsers', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function createUser(userId: number, accountId: number, name: string, email: string, roleId: number, teamId: number): Promise<DataReturnObject<boolean>> {

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

        const normalizedEmail = email.toLowerCase().trim();

        const existingUserResult = await getRowsByColumnValue(dbClient, 'users', 'email', normalizedEmail);
        if(!existingUserResult.status) {
            return {
                status: false,
                data: null,
                message: existingUserResult.message
            };
        }

        let targetUserId: number;

        if(existingUserResult.data && existingUserResult.data.length > 0) {
            targetUserId = existingUserResult.data[0].id;

            const existingUserAccountQuery = await dbClient.query(
                `SELECT * FROM user_account WHERE user_id = $1 AND account_id = $2`,
                [targetUserId, accountId]
            );
            
            if(existingUserAccountQuery.rows && existingUserAccountQuery.rows.length > 0) {
                return {
                    status: false,
                    data: null,
                    message: 'User already has access to this account'
                };
            }
        } else {
            const passwordResult = await generatePassword();
            if(!passwordResult.status || !passwordResult.data) {
                return {
                    status: false,
                    data: null,
                    message: passwordResult.message
                };
            }

            const password = passwordResult.data;

            const createUserResult = await dynamicSendData(
                dbClient,
                'users',
                ['name', 'email', 'password', 'must_change_password'],
                [name, normalizedEmail, password, true]
            );
            if(!createUserResult.status || !createUserResult.data) {
                return {
                    status: false,
                    data: null,
                    message: createUserResult.message
                };
            }

            targetUserId = createUserResult.data;

            const sendEmailResult = await sendEmailToUser(
                normalizedEmail,
                'Welcome to our platform',
                `Your account has been created. Your temporary password is: ${password}\n\nPlease change your password after logging in.`
            );
            if(!sendEmailResult.status || !sendEmailResult.data) {
                logger.error('createUser - Failed to send email', { email: normalizedEmail });
            }
        }

        const teamVerificationResult = await dbClient.query(
            `SELECT id FROM team WHERE id = $1 AND account_id = $2`,
            [teamId, accountId]
        );
        
        if(!teamVerificationResult.rows || teamVerificationResult.rows.length === 0) {
            return {
                status: false,
                data: null,
                message: 'Team does not belong to this account'
            };
        }

        const createUserAccountResult = await dynamicSendData(
            dbClient,
            'user_account',
            ['user_id', 'account_id', 'role_id', 'team_id'],
            [targetUserId, accountId, roleId, teamId]
        );
        if(!createUserAccountResult.status || !createUserAccountResult.data) {
            return {
                status: false,
                data: null,
                message: createUserAccountResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'User created successfully'
        };

    } catch(error: unknown) {
        logger.error('createUser', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function deleteUser(userId: number, accountId: number, userAccountId: number): Promise<DataReturnObject<boolean>> {

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

        const userAccountResult = await getRowById(dbClient, 'user_account', userAccountId);
        if(!userAccountResult.status || !userAccountResult.data) {
            return {
                status: false,
                data: null,
                message: 'User account relationship not found'
            };
        }

        if(userAccountResult.data.account_id !== accountId) {
            return {
                status: false,
                data: null,
                message: 'User account does not belong to this account'
            };
        }

        const deleteResult = await deleteRowById(dbClient, 'user_account', userAccountId);
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
            message: 'User access removed successfully'
        };

    } catch(error: unknown) {
        logger.error('deleteUser', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

export async function deleteUserFromSystem(targetUserId: number): Promise<DataReturnObject<boolean>> {

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

        const userResult = await getRowById(dbClient, 'users', targetUserId);
        if(!userResult.status || !userResult.data) {
            return {
                status: false,
                data: null,
                message: 'User not found'
            };
        }

        const deleteUserAccountsResult = await dbClient.query(
            `DELETE FROM user_account WHERE user_id = $1`,
            [targetUserId]
        );

        const deleteUserResult = await deleteRowById(dbClient, 'users', targetUserId);
        if(!deleteUserResult.status || !deleteUserResult.data) {
            return {
                status: false,
                data: null,
                message: deleteUserResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'User deleted successfully from the system'
        };

    } catch(error: unknown) {
        logger.error('deleteUserFromSystem', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    } finally {
        await handleCloseDatabaseConnections(null, dbClient);
    }
}

