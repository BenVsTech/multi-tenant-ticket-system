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
                NEW.password = crypt(NEW.password, gen_salt('bf', 12));
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        `,
        `
        CREATE OR REPLACE FUNCTION check_password_expiration()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Set password_changed_at on INSERT if password is provided
            IF TG_OP = 'INSERT' AND NEW.password IS NOT NULL THEN
                NEW.password_changed_at = CURRENT_TIMESTAMP;
            END IF;
            
            -- Update password_changed_at when password changes
            IF TG_OP = 'UPDATE' AND NEW.password IS DISTINCT FROM OLD.password THEN
                NEW.password_changed_at = CURRENT_TIMESTAMP;
                NEW.must_change_password = false;
            END IF;
            
            -- Check if password is older than 3 months
            IF NEW.password_changed_at IS NOT NULL THEN
                IF NEW.password_changed_at < CURRENT_TIMESTAMP - INTERVAL '3 months' THEN
                    NEW.must_change_password = true;
                END IF;
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        `,
        `
        CREATE OR REPLACE FUNCTION delete_empty_accounts()
        RETURNS TRIGGER AS $$
        DECLARE
            account_user_count INTEGER;
        BEGIN
            -- After a DELETE from user_account, check if the account has any remaining users
            IF TG_OP = 'DELETE' THEN
                SELECT COUNT(*) INTO account_user_count
                FROM user_account
                WHERE account_id = OLD.account_id;
                
                -- If no users remain, delete the account
                IF account_user_count = 0 THEN
                    DELETE FROM account WHERE id = OLD.account_id;
                END IF;
            END IF;
            
            RETURN OLD;
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
                    name: 'must_change_password',
                    type: databaseConstants.boolean,
                },
                {
                    name: 'password_changed_at',
                    type: databaseConstants.timestamp,
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

