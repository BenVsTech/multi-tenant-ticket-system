// Imports

import { timingSafeEqual } from "crypto";
import { DataReturnObject } from "@/types/helper";
import { DatabaseClient } from "../database";
import { DatabaseConfiguration, DatabaseTable } from "@/types/database";
import { validateIdentifierOrError, validateColumnTypeOrError, validateForeignKeyConstraintOrError, validateUniqueConstraintOrError, validateTenantTable, escapeIdentifier } from "../validation";
import { logger } from "../helper";
import { UserAccountRow, RolePermissionRow, DatabaseRow, UserRow, AccountRow, RoleRow, PermissionRow } from "@/types/component";

// Functions

const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
};

// Exports

export async function checkIfDatabaseExists(client: DatabaseClient, databaseName: string): Promise<DataReturnObject<boolean>> {
    try{

        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [databaseName]
        );

        const databaseExists = result.rows.length > 0;

        return {
            status: true,
            data: databaseExists,
            message: 'Database exists'
        };

    } catch(error: unknown) {
        logger.error('checkIfDatabaseExists', error, { databaseName });
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function createDatabase(client: DatabaseClient, databaseName: string): Promise<DataReturnObject<boolean>> {
    try{

        const validationError = validateIdentifierOrError<boolean>(databaseName, 'database');
        if (validationError) return validationError;

        const escapedDatabaseName = escapeIdentifier(databaseName);
        await client.query(`CREATE DATABASE ${escapedDatabaseName}`);

        return {
            status: true,
            data: true,
            message: `Database '${databaseName}' created successfully`
        };

    } catch(error: unknown) {
        logger.error('createDatabase', error, { databaseName });
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function enablePgcryptoExtension(client: DatabaseClient): Promise<DataReturnObject<boolean>> {
    try{

        await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

        return {
            status: true,
            data: true,
            message: 'pgcrypto extension enabled successfully'
        };

    } catch(error: unknown) {
        logger.error('enablePgcryptoExtension', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function createGlobalTriggerFunctions(client: DatabaseClient, globalTriggerFunctions: string[]): Promise<DataReturnObject<boolean>> {
    try{

        for (const functionSQL of globalTriggerFunctions) {
            await client.query(functionSQL);
        }

        return {
            status: true,
            data: true,
            message: 'Global trigger functions created successfully'
        };

    } catch(error: unknown) {
        logger.error('createGlobalTriggerFunctions', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function createTable(client: DatabaseClient, table: DatabaseTable): Promise<DataReturnObject<boolean>> {
    let escapedTableName: string | null = null;
    try{

        const tableValidationError = validateIdentifierOrError<boolean>(table.name, 'table');
        if (tableValidationError) return tableValidationError;

        for (const col of table.columns) {
            const columnValidationError = validateIdentifierOrError<boolean>(col.name, 'column');
            if (columnValidationError) return columnValidationError;
            
            const columnTypeValidationError = validateColumnTypeOrError<boolean>(col.type);
            if (columnTypeValidationError) return columnTypeValidationError;
        }

        const foreignKeysValidationError = validateForeignKeyConstraintOrError<boolean>(table.foreignKeys);
        if (foreignKeysValidationError) return foreignKeysValidationError;

        const uniqueConstraintsValidationError = validateUniqueConstraintOrError<boolean>(table.uniqueConstraints);
        if (uniqueConstraintsValidationError) return uniqueConstraintsValidationError;

        escapedTableName = escapeIdentifier(table.name);
        const columnDefinitions = table.columns
            .map(col => `${escapeIdentifier(col.name)} ${col.type}`)
            .join(', ');

        let createTableSQL = `CREATE TABLE IF NOT EXISTS ${escapedTableName} (${columnDefinitions}`;

        if (table.foreignKeys && table.foreignKeys.trim()) {
            createTableSQL += `, ${table.foreignKeys.trim()}`;
        }

        if (table.uniqueConstraints && table.uniqueConstraints.trim()) {
            createTableSQL += `, ${table.uniqueConstraints.trim()}`;
        }

        createTableSQL += ')';

        await client.query(createTableSQL);

        if (table.useUpdatedAtTrigger) {
            const triggerName = `trigger_update_${table.name}_updated_at`;
            const escapedTriggerName = escapeIdentifier(triggerName);
            await client.query(`
                DROP TRIGGER IF EXISTS ${escapedTriggerName} ON ${escapedTableName};
                CREATE TRIGGER ${escapedTriggerName}
                BEFORE UPDATE ON ${escapedTableName}
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            `);
        }

        if (table.usePasswordEncryptionTrigger) {
            const triggerName = `trigger_encrypt_${table.name}_password`;
            const escapedTriggerName = escapeIdentifier(triggerName);
            await client.query(`
                DROP TRIGGER IF EXISTS ${escapedTriggerName} ON ${escapedTableName};
                CREATE TRIGGER ${escapedTriggerName}
                BEFORE INSERT OR UPDATE ON ${escapedTableName}
                FOR EACH ROW
                EXECUTE FUNCTION encrypt_password_before_insert();
            `);
        }

        if (table.name === 'users') {
            const triggerName = `trigger_check_password_expiration`;
            const escapedTriggerName = escapeIdentifier(triggerName);
            await client.query(`
                DROP TRIGGER IF EXISTS ${escapedTriggerName} ON ${escapedTableName};
                CREATE TRIGGER ${escapedTriggerName}
                BEFORE INSERT OR UPDATE ON ${escapedTableName}
                FOR EACH ROW
                EXECUTE FUNCTION check_password_expiration();
            `);
        }

        if (table.name === 'user_account') {
            const triggerName = `trigger_delete_empty_accounts`;
            const escapedTriggerName = escapeIdentifier(triggerName);
            await client.query(`
                DROP TRIGGER IF EXISTS ${escapedTriggerName} ON ${escapedTableName};
                CREATE TRIGGER ${escapedTriggerName}
                AFTER DELETE ON ${escapedTableName}
                FOR EACH ROW
                EXECUTE FUNCTION delete_empty_accounts();
            `);
        }

        return {
            status: true,
            data: true,
            message: `Table '${table.name}' created successfully`
        };

    } catch(error: unknown) {
        logger.error('createTable', error, { table: table.name });
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function createRolePermissions(
    client: DatabaseClient, 
    permissions: {name: string, description: string}[], 
    roles: {name: string, description: string}[], 
    rolePermissions: {roleName: string, permissionName: string}[]
): Promise<DataReturnObject<boolean>> {
    try{

        for (const permission of permissions) {

            const sendPermissionObject = await dynamicSendData(
                client, 
                'permission', 
                ['name', 'description'], 
                [permission.name, permission.description]
            );
            if (!sendPermissionObject.status || !sendPermissionObject.data) {
                return {
                    status: false,
                    data: null,
                    message: sendPermissionObject.message
                }
            }

        }

        for (const role of roles) {

            const sendRoleObject = await dynamicSendData(
                client, 
                'role', 
                ['name', 'description'], 
                [role.name, role.description]
            );
            if (!sendRoleObject.status || !sendRoleObject.data) {
                return {
                    status: false,
                    data: null,
                    message: sendRoleObject.message
                }
            }

        }

        for (const rolePermission of rolePermissions) {

            const roleObject = await getRowsByColumnValue(client, 'role', 'name', rolePermission.roleName);
            if (!roleObject.status || !roleObject.data) {
                return {
                    status: false,
                    data: null,
                    message: roleObject.message
                }
            }

            const roleId = roleObject.data[0].id;

            const permissionObject = await getRowsByColumnValue(client, 'permission', 'name', rolePermission.permissionName);
            if (!permissionObject.status || !permissionObject.data) {
                return {
                    status: false,
                    data: null,
                    message: permissionObject.message
                }
            }

            const permissionId = permissionObject.data[0].id;

            const sendRolePermissionObject = await dynamicSendData(
                client, 
                'role_permission', 
                ['role_id', 'permission_id'], 
                [roleId, permissionId]
            );
            if (!sendRolePermissionObject.status || !sendRolePermissionObject.data) {
                return {
                    status: false,
                    data: null,
                    message: sendRolePermissionObject.message
                }
            }

        }

        return {
            status: true,
            data: true,
            message: 'Role permissions created successfully'
        };

    } catch(error: unknown) {
        logger.error('createRolePermissions', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function createDatabaseSchema(
    client: DatabaseClient, 
    config: DatabaseConfiguration, 
    permissions: {name: string, description: string}[], 
    roles: {name: string, description: string}[], 
    rolePermissions: {roleName: string, permissionName: string}[]
): Promise<DataReturnObject<boolean>> {
    
    try{

        const enablePgcryptoExtensionResult = await enablePgcryptoExtension(client);
        if (!enablePgcryptoExtensionResult.status) {
            return enablePgcryptoExtensionResult;
        }

        const functionsResult = await createGlobalTriggerFunctions(client, config.globalTriggerFunctions);
        if (!functionsResult.status) {
            return functionsResult;
        }

        for (const table of config.tables) {
            const tableResult = await createTable(client, table);
            if (!tableResult.status) {
                return tableResult;
            }
        }

        const rolePermissionsResult = await createRolePermissions(client, permissions, roles, rolePermissions);
        if (!rolePermissionsResult.status) {
            return rolePermissionsResult;
        }

        return {
            status: true,
            data: true,
            message: 'Database schema created successfully'
        };

    } catch(error: unknown) {
        logger.error('createDatabaseSchema', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function checkPassword(client: DatabaseClient, email: string, password: string): Promise<DataReturnObject<string>> {
    try{

        let passwordHash: string;
        let userId: string | null = null;
        
        const userResult = await getRowsByColumnValue(
            client,
            'users',
            'email',
            email
        );
        if (!userResult.status || !userResult.data || userResult.data.length === 0) {
            passwordHash = '$2a$10$dummyhashfordummyuserenumerationprevention';
        } else {
            const user = userResult.data[0] as UserRow;
            passwordHash = user.password as string;
            userId = user.id.toString();
        }

        const passwordCheckResult = await client.query(
            `SELECT crypt($1, $2) as computed_hash`,
            [password, passwordHash]
        );
        if (
            !passwordCheckResult.rows ||
            passwordCheckResult.rows.length === 0 ||
            !passwordCheckResult.rows[0].computed_hash
        ) {
            return {
                status: false,
                data: null,
                message: 'Invalid email or password'
            };
        }

        const computedHash = passwordCheckResult.rows[0].computed_hash;
        const storedHashBuffer = Buffer.from(passwordHash, 'utf8');
        const computedHashBuffer = Buffer.from(computedHash, 'utf8');
        
        let passwordsMatch = false;
        if (storedHashBuffer.length === computedHashBuffer.length) {
            try {
                passwordsMatch = timingSafeEqual(storedHashBuffer, computedHashBuffer);
            } catch (error) {
                passwordsMatch = false;
            }
        }
        if (!passwordsMatch || userId === null) {
            return {
                status: false,
                data: null,
                message: 'Invalid email or password'
            };
        }

        return {
            status: true,
            data: userId,
            message: 'Password checked successfully'
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: 'Invalid email or password'
        };
    }
}

export async function getUserRoles(client: DatabaseClient, userId: number): Promise<DataReturnObject<{accountId: number, accountName: string, role: string, permissions: string[]}[]>> {
    try {
        const userAccountResult = await getRowsByColumnValue(client, 'user_account', 'user_id', userId.toString());
        if (!userAccountResult.status) {
            return {
                status: false,
                data: null,
                message: 'Failed to fetch user accounts'
            };
        }

        const userAccounts = (userAccountResult.data && userAccountResult.data.length > 0 
            ? userAccountResult.data 
            : []) as UserAccountRow[];

        const roles = (await Promise.all(userAccounts.map(async (userAccount: UserAccountRow) => {

            let permissions: string[] = [];

            if (!client) {
                return null;
            }

            const roleResult = await getRowById(client, 'role', userAccount.role_id);
            if (!roleResult.status || !roleResult.data) {
                return null;
            }

            const role = roleResult.data as RoleRow;

            const rolePermissionsResult = await getRowsByColumnValue(client, 'role_permission', 'role_id', role.id.toString());
            if (!rolePermissionsResult.status || !rolePermissionsResult.data) {
                return null;
            }

            const permissionIds = (rolePermissionsResult.data as RolePermissionRow[]).map((rolePermission) => rolePermission.permission_id);

            for (const permissionId of permissionIds) {

                const permissionResult = await getRowById(client, 'permission', permissionId);
                if (!permissionResult.status || !permissionResult.data) {
                    continue;
                }

                const permission = permissionResult.data as PermissionRow;
                permissions.push(permission.name as string);
            }

            const accountResult = await getRowById(client, 'account', userAccount.account_id);
            if (!accountResult.status || !accountResult.data) {
                return null;
            }

            const account = accountResult.data as AccountRow;

            return {
                accountId: userAccount.account_id,
                accountName: account.name as string,
                role: role.name as string,
                permissions: permissions,
            };

        }))).filter((role): role is NonNullable<typeof role> => role !== null);

        return {
            status: true,
            data: roles,
            message: 'User roles fetched successfully'
        };
    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: 'Failed to fetch user roles'
        };
    }
}

export async function authorizeUser(client: DatabaseClient, email: string, password: string): Promise<DataReturnObject<{id: number, email: string, name: string, roles: {accountId: number, accountName: string, role: string, permissions: string[]}[], mustChangePassword: boolean }>> {
    try{

        const passwordCheckResult = await checkPassword(client, email, password);
          if (!passwordCheckResult.status || !passwordCheckResult.data) {
            return {
                status: false,
                data: null,
                message: 'Invalid email or password'
            };
          }

          const userResult = await getRowById(client, 'users', parseInt(passwordCheckResult.data));
          if (!userResult.status || !userResult.data) {
            return {
                status: false,
                data: null,
                message: 'Invalid email or password'
            };
          }

          const user = userResult.data as UserRow;
          const mustChangePassword = user.must_change_password === true;

          const rolesResult = await getUserRoles(client, user.id);
          if (!rolesResult.status || !rolesResult.data) {
            return {
                status: false,
                data: null,
                message: 'Invalid email or password'
            };
          }

          const roles = rolesResult.data;

        return {
            status: true,
            data: {
                id: user.id,
                email: user.email as string,
                name: user.name as string,
                roles: roles,
                mustChangePassword: mustChangePassword
            },
            message: 'User authorized successfully'
        }

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: 'Invalid email or password'
        };
    }
}

export async function dynamicSendData(client: DatabaseClient, table: string, columns: string[], data: (string | number | boolean | null)[]): Promise<DataReturnObject<number>> {
    try{

        const tableValidationError = validateIdentifierOrError<number>(table, 'table');
        if (tableValidationError) return tableValidationError;

        for (const column of columns) {
            const columnValidationError = validateIdentifierOrError<number>(column, 'column');
            if (columnValidationError) return columnValidationError;
        }

        if (columns.length !== data.length) {
            return {
                status: false,
                data: null,
                message: 'Columns and data arrays must have the same length'
            };
        }

        const placeholders = data.map((_, index) => `$${index + 1}`).join(', ');
        const escapedTableName = escapeIdentifier(table);
        const escapedColumns = columns.map(col => escapeIdentifier(col)).join(', ');

        const query = `INSERT INTO ${escapedTableName} (${escapedColumns}) VALUES (${placeholders}) RETURNING *`;
        
        const result = await client.query(query, data);
        
        return {
            status: true,
            data: result.rows[0].id,
            message: 'Data sent successfully'
        };

    } catch(error: unknown) {
        logger.error('dynamicSendData', error, { table });
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function updateRowById(client: DatabaseClient, table: string, columns: string[], data: (string | number | boolean | null)[], id: number, accountId?: number): Promise<DataReturnObject<boolean>> {
    try{

        const tableValidationError = validateIdentifierOrError<boolean>(table, 'table');
        if (tableValidationError) return tableValidationError;

        if (columns.length !== data.length) {
            return {
                status: false,
                data: null,
                message: 'Columns and data arrays must have the same length'
            };
        }

        for (const column of columns) {
            const columnValidationError = validateIdentifierOrError<boolean>(column, 'column');
            if (columnValidationError) return columnValidationError;
        }

        const tenantTableValidation = validateTenantTable(table);

        if (tenantTableValidation.status && accountId === undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID is required for tenant table '${table}'`
            };
        }

        if (!tenantTableValidation.status && accountId !== undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID cannot be used with non-tenant table '${table}'`
            };
        }

        const escapedTableName = escapeIdentifier(table);
        const setClause = columns.map((col, index) => `${escapeIdentifier(col)} = $${index + 1}`).join(', ');

        const queryString = tenantTableValidation.status
            ? `UPDATE ${escapedTableName} SET ${setClause} WHERE id = $${columns.length + 1} AND account_id = $${columns.length + 2}`
            : `UPDATE ${escapedTableName} SET ${setClause} WHERE id = $${columns.length + 1}`;

        const result = await client.query(
            queryString,
            tenantTableValidation.status ? [...data, id, accountId] : [...data, id]
        );

        return {
            status: true,
            data: result.rowCount && result.rowCount > 0 ? true : false,
            message: `Row with id '${id}' in table '${table}' updated successfully`
        };

    } catch(error: unknown) {
        logger.error('updateRowById', error, { table, id });
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function getAllRowsFromTable(client: DatabaseClient, table: string, accountId?: number): Promise<DataReturnObject<DatabaseRow[]>> {
    try{

        const validationError = validateIdentifierOrError<DatabaseRow[]>(table, 'table');
        if (validationError) return validationError;

        const tenantTableValidation = validateTenantTable(table);

        if (tenantTableValidation.status && accountId === undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID is required for tenant table '${table}'`
            };
        }

        if (!tenantTableValidation.status && accountId !== undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID cannot be used with non-tenant table '${table}'`
            };
        }

        const escapedTableName = escapeIdentifier(table);
        const queryString = tenantTableValidation.status
            ? `SELECT * FROM ${escapedTableName} WHERE account_id = $1 ORDER BY created_at DESC`
            : `SELECT * FROM ${escapedTableName} ORDER BY created_at DESC`;

        const result = await client.query(
            queryString,
            tenantTableValidation.status ? [accountId] : []
        );

        return {
            status: true,
            data: result.rows,
            message: `All rows from table '${table}' retrieved successfully`
        };

    } catch(error: unknown) {
        logger.error('getAllRowsFromTable', error, { table });
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function getRowById(client: DatabaseClient, table: string, id: number, accountId?: number): Promise<DataReturnObject<DatabaseRow>> {
    try{

        const validationError = validateIdentifierOrError<DatabaseRow>(table, 'table');
        if (validationError) return validationError;

        const tenantTableValidation = validateTenantTable(table);

        if (tenantTableValidation.status && accountId === undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID is required for tenant table '${table}'`
            };
        }

        if (!tenantTableValidation.status && accountId !== undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID cannot be used with non-tenant table '${table}'`
            };
        }

        const escapedTableName = escapeIdentifier(table);
        const queryString = tenantTableValidation.status
            ? `SELECT * FROM ${escapedTableName} WHERE id = $1 AND account_id = $2`
            : `SELECT * FROM ${escapedTableName} WHERE id = $1`;

        const result = await client.query(
            queryString,
            tenantTableValidation.status ? [id, accountId] : [id]
        );

        return {
            status: true,
            data: result.rows[0],
            message: `Row with id '${id}' from table '${table}' retrieved successfully`
        };

    } catch(error: unknown) {
        logger.error('getRowById', error, { table });
        return {
            status: false,
            data: null,
            message: `Database operation failed`
        };
    }
}

export async function getRowsByColumnValue(client: DatabaseClient, table: string, column: string, value: string, accountId?: number): Promise<DataReturnObject<DatabaseRow[]>> {
    try{

        const tableValidationError = validateIdentifierOrError<DatabaseRow[]>(table, 'table');
        if (tableValidationError) return tableValidationError;

        const columnValidationError = validateIdentifierOrError<DatabaseRow[]>(column, 'column');
        if (columnValidationError) return columnValidationError;

        const tenantTableValidation = validateTenantTable(table);

        if (tenantTableValidation.status && accountId === undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID is required for tenant table '${table}'`
            };
        }

        if (!tenantTableValidation.status && accountId !== undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID cannot be used with non-tenant table '${table}'`
            };
        }

        const escapedTableName = escapeIdentifier(table);
        const escapedColumnName = escapeIdentifier(column);
        const queryString = tenantTableValidation.status
            ? `SELECT * FROM ${escapedTableName} WHERE ${escapedColumnName} = $1 AND account_id = $2`
            : `SELECT * FROM ${escapedTableName} WHERE ${escapedColumnName} = $1`;

        const result = await client.query(
            queryString,
            tenantTableValidation.status ? [value, accountId] : [value]
        );

        if(result.rows.length === 0) {
            return {
                status: true,
                data: [],
                message: `No rows found`
            };
        } else {
            return {
                status: true,
                data: result.rows,
                message: `Rows retrieved successfully`
            };
        }

    } catch(error: unknown) {
        logger.error('getRowsByColumnValue', error, { table, column });
        return {
            status: false,
            data: null,
            message: `Database operation failed`
        };
    }
}

export async function deleteRowById(client: DatabaseClient, table: string, id: number, accountId?: number): Promise<DataReturnObject<boolean>> {
    try{

        const validationError = validateIdentifierOrError<boolean>(table, 'table');
        if (validationError) return validationError;

        const tenantTableValidation = validateTenantTable(table);

        if (tenantTableValidation.status && accountId === undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID is required for tenant table '${table}'`
            };
        }

        if (!tenantTableValidation.status && accountId !== undefined) {
            return {
                status: false,
                data: null,
                message: `Account ID cannot be used with non-tenant table '${table}'`
            };
        }

        const escapedTableName = escapeIdentifier(table);
        const queryString = tenantTableValidation.status
            ? `DELETE FROM ${escapedTableName} WHERE id = $1 AND account_id = $2`
            : `DELETE FROM ${escapedTableName} WHERE id = $1`;

        const result = await client.query(
            queryString,
            tenantTableValidation.status ? [id, accountId] : [id]
        );

        return {
            status: true,
            data: result.rowCount && result.rowCount > 0 ? true : false,
            message: `Row with id '${id}' from table '${table}' deleted successfully`
        };

    } catch(error: unknown) {
        logger.error('deleteRowById', error, { table, id });
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}

export async function getStringRowsAccounts(client: DatabaseClient, userId: number): Promise<DataReturnObject<string[][]>> {
    try{

        const getRoleIdObject = await getRowsByColumnValue(client, 'role', 'name', 'owner');
        if(!getRoleIdObject.status || !getRoleIdObject.data) {
            return {
                status: false,
                data: null,
                message: getRoleIdObject.message
            };
        }

        const roleId = getRoleIdObject.data[0].id;

        const result = await client.query(`SELECT * FROM user_account WHERE user_id = $1 AND role_id = $2`, [userId, roleId]);
        if(!result.rows || result.rows.length === 0) {
            return {
                status: true,
                data: [],
                message: 'No accounts found'
            };
        }

        const accountsResult = await Promise.all(result.rows.map(async (row) => {
            const accountObject = await getRowById(client, 'account', row.account_id);
            if(!accountObject.status || !accountObject.data) {
                return null;
            }
            return [
                row.account_id.toString(), 
                accountObject.data.name, 
                accountObject.data.description, 
                formatDate(row.updated_at), 
                formatDate(row.created_at)
            ];
        }));
        if(accountsResult.some((account) => account === null)) {
            return {
                status: false,
                data: null,
                message: 'Failed to retrieve accounts'
            };
        }

        const accounts = accountsResult.filter((account) => account !== null);

        return {
            status: true,
            data: accounts,
            message: 'Accounts retrieved successfully'
        }

    } catch(error: unknown) {
        logger.error('getStringRowsAccounts', error);
        return {
            status: false,
            data: null,
            message: 'Database operation failed'
        };
    }
}
