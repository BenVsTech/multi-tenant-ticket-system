// Imports

import { DatabaseConfiguration } from "@/types/database";
import { databaseConstants } from "@/utils/constants";

// Exports

export const databaseConfiguration: DatabaseConfiguration = {
    name: 'mt_ticket_system',
    globalTriggerFunctions: [
        `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        `,
        `
        CREATE OR REPLACE FUNCTION encrypt_password_before_insert()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.password IS NOT NULL THEN
                NEW.password = crypt(NEW.password, gen_salt('bf'));
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        `,
    ],
    tables: [
        {
            name: 'permission',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'name',
                    type: databaseConstants.varchar(255),
                },
                {
                    name: 'description',
                    type: databaseConstants.varchar(512),
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: '',
            uniqueConstraints: '',
            useUpdatedAtTrigger: true,
            usePasswordEncryptionTrigger: false,
        },
        {
            name: 'role',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'name',
                    type: databaseConstants.varchar(255),
                },
                {
                    name: 'description',
                    type: databaseConstants.varchar(512),
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: '',
            uniqueConstraints: '',
            useUpdatedAtTrigger: true,
            usePasswordEncryptionTrigger: false,
        },
        {
            name: 'role_permission',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'role_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'permission_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: `
                FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
            `,
            uniqueConstraints: '',
            useUpdatedAtTrigger: true,
            usePasswordEncryptionTrigger: false,
        },
        {
            name: 'users',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'name',
                    type: databaseConstants.varchar(255),
                },
                {
                    name: 'email',
                    type: databaseConstants.varchar(255),
                },
                {
                    name: 'password',
                    type: databaseConstants.varchar(255),
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: '',
            uniqueConstraints: '',
            useUpdatedAtTrigger: true,
            usePasswordEncryptionTrigger: true,
        },
        {
            name: 'account',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'name',
                    type: databaseConstants.varchar(255),
                },
                {
                    name: 'description',
                    type: databaseConstants.varchar(512),
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: '',
            uniqueConstraints: '',
            useUpdatedAtTrigger: true,
            usePasswordEncryptionTrigger: false,
        },
        {
            name: 'user_account',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'user_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'account_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'role_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: `
                FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
                FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            `,
            uniqueConstraints: '',
            useUpdatedAtTrigger: true,
            usePasswordEncryptionTrigger: false,
        },
        {
            name: 'team',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'name',
                    type: databaseConstants.integer,
                },
                {
                    name: 'description',
                    type: databaseConstants.integer,
                },
                {
                    name: 'account_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: `
                FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
            `,
            uniqueConstraints: '',
            useUpdatedAtTrigger: true,
            usePasswordEncryptionTrigger: false,
        },
        {
            name: 'team_user',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'team_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'user_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'account_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: `
                FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
            `,
            uniqueConstraints: '',
            useUpdatedAtTrigger: true,
            usePasswordEncryptionTrigger: false,
        },
        {
            name: 'ticket',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'title',
                    type: databaseConstants.varchar(255),
                },
                {
                    name: 'description',
                    type: databaseConstants.varchar(512),
                },
                {
                    name: 'status',
                    type: databaseConstants.varchar(255),
                },
                {
                    name: 'created_by_user_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'assigned_to_user_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'account_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: `
                FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
            `,
            uniqueConstraints: '',
            useUpdatedAtTrigger: true,
            usePasswordEncryptionTrigger: false,
        },
        {
            name: 'comment',
            columns: [
                {
                    name: 'id',
                    type: databaseConstants.primaryKey,
                },
                {
                    name: 'text',
                    type: databaseConstants.varchar(1024),
                },
                {
                    name: 'ticket_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'author_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'account_id',
                    type: databaseConstants.integer,
                },
                {
                    name: 'created_at',
                    type: databaseConstants.defaultTimestamp,
                },
                {
                    name: 'updated_at',
                    type: databaseConstants.defaultTimestamp,
                },
            ],
            foreignKeys: `
                FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
            `,
            uniqueConstraints: '',
            useUpdatedAtTrigger: false,
            usePasswordEncryptionTrigger: false,
        }
    ],
}

