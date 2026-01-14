// Imports

import { DataReturnObject } from "@/types/helper";
import { DatabaseClient } from "../database";
import { DatabaseConfiguration, DatabaseTable } from "@/types/database";

// Validation Functions

function validateIdentifier(name: string, type: 'table' | 'column' | 'database'): boolean {
    if (!name || name.length === 0 || name.length > 63) {
        return false;
    }
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

function validateIdentifierOrError<T>(name: string, type: 'table' | 'column' | 'database'): DataReturnObject<T> | null {
    if (!validateIdentifier(name, type)) {
        return {
            status: false,
            data: null,
            message: `Invalid ${type} name format: '${name}'. Must start with letter/underscore and contain only letters, numbers, and underscores (max 63 chars)`
        } as DataReturnObject<T>;
    }
    return null;
}

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
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while checking if database exists'
        };
    }
}

export async function createDatabase(client: DatabaseClient, databaseName: string): Promise<DataReturnObject<boolean>> {
    try{

        const validationError = validateIdentifierOrError<boolean>(databaseName, 'database');
        if (validationError) return validationError;

        await client.query(`CREATE DATABASE ${databaseName}`);

        return {
            status: true,
            data: true,
            message: `Database '${databaseName}' created successfully`
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while creating database'
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
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while enabling pgcrypto extension'
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
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while creating global trigger functions'
        };
    }
}

export async function createTable(client: DatabaseClient, table: DatabaseTable): Promise<DataReturnObject<boolean>> {
    try{

        const tableValidationError = validateIdentifierOrError<boolean>(table.name, 'table');
        if (tableValidationError) return tableValidationError;

        for (const col of table.columns) {
            const columnValidationError = validateIdentifierOrError<boolean>(col.name, 'column');
            if (columnValidationError) return columnValidationError;
        }

        const columnDefinitions = table.columns.map(col => `${col.name} ${col.type}`).join(', ');

        let createTableSQL = `CREATE TABLE IF NOT EXISTS ${table.name} (${columnDefinitions}`;

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
            await client.query(`
                DROP TRIGGER IF EXISTS ${triggerName} ON ${table.name};
                CREATE TRIGGER ${triggerName}
                BEFORE UPDATE ON ${table.name}
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            `);
        }

        if (table.usePasswordEncryptionTrigger) {
            const triggerName = `trigger_encrypt_${table.name}_password`;
            await client.query(`
                DROP TRIGGER IF EXISTS ${triggerName} ON ${table.name};
                CREATE TRIGGER ${triggerName}
                BEFORE INSERT OR UPDATE ON ${table.name}
                FOR EACH ROW
                EXECUTE FUNCTION encrypt_password_before_insert();
            `);
        }

        return {
            status: true,
            data: true,
            message: `Table '${table.name}' created successfully`
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : `Unknown error while creating table '${table.name}'`
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
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : `Unknown error while creating role permissions`
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
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while creating database schema'
        };
    }
}

export async function dynamicSendData(client: DatabaseClient, table: string, columns: string[], data: any[]): Promise<DataReturnObject<any>> {
    try{

        const tableValidationError = validateIdentifierOrError<any>(table, 'table');
        if (tableValidationError) return tableValidationError;

        for (const column of columns) {
            const columnValidationError = validateIdentifierOrError<any>(column, 'column');
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

        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        
        const result = await client.query(query, data);
        
        return {
            status: true,
            data: result.rows[0].id,
            message: 'Data sent successfully'
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : `Unknown error while sending data to table '${table}'`
        };
    }
}

export async function updateRowById(client: DatabaseClient, table: string, columns: string[], data: any[], id: number): Promise<DataReturnObject<boolean>> {
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

        const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');

        const query = `UPDATE ${table} SET ${setClause} WHERE id = $${columns.length + 1}`;

        const result = await client.query(query, [...data, id]);

        return {
            status: true,
            data: result.rowCount && result.rowCount > 0 ? true : false,
            message: `Row with id '${id}' in table '${table}' updated successfully`
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : `Unknown error while updating row with id '${id}' in table '${table}'`
        };
    }
}

export async function getAllRowsFromTable(client: DatabaseClient, table: string): Promise<DataReturnObject<any[]>> {
    try{

        const validationError = validateIdentifierOrError<any[]>(table, 'table');
        if (validationError) return validationError;

        const result = await client.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);

        return {
            status: true,
            data: result.rows,
            message: `All rows from table '${table}' retrieved successfully`
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : `Unknown error while getting all rows from table '${table}'`
        };
    }
}

export async function getRowById(client: DatabaseClient, table: string, id: number): Promise<DataReturnObject<any>> {
    try{

        const validationError = validateIdentifierOrError<any>(table, 'table');
        if (validationError) return validationError;

        const result = await client.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);

        return {
            status: true,
            data: result.rows[0],
            message: `Row with id '${id}' from table '${table}' retrieved successfully`
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : `Unknown error while getting row with id '${id}' from table '${table}'`
        };
    }
}

export async function getRowsByColumnValue(client: DatabaseClient, table: string, column: string, value: string): Promise<DataReturnObject<any[]>> {
    try{

        const tableValidationError = validateIdentifierOrError<any[]>(table, 'table');
        if (tableValidationError) return tableValidationError;

        const columnValidationError = validateIdentifierOrError<any[]>(column, 'column');
        if (columnValidationError) return columnValidationError;

        const result = await client.query(`SELECT * FROM ${table} WHERE ${column} = $1`, [value]);

        if(result.rows.length === 0) {
            return {
                status: true,
                data: [],
                message: `No rows with column value '${value}' from table '${table}' found`
            };
        } else {
            return {
                status: true,
                data: result.rows,
                message: `Rows with column value '${value}' from table '${table}' retrieved successfully`
            };
        }

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : `Unknown error while getting rows by column value '${value}' from table '${table}'`
        };
    }
}

export async function deleteRowById(client: DatabaseClient, table: string, id: number): Promise<DataReturnObject<boolean>> {
    try{

        const validationError = validateIdentifierOrError<boolean>(table, 'table');
        if (validationError) return validationError;

        const result = await client.query(`DELETE FROM ${table} WHERE id = $1`, [id]);

        return {
            status: true,
            data: result.rowCount && result.rowCount > 0 ? true : false,
            message: `Row with id '${id}' from table '${table}' deleted successfully`
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : `Unknown error while deleting row with id '${id}' from table '${table}'`
        };
    }
}
