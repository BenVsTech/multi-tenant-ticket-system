// Exports

export interface DatabaseColumn {
    name: string;
    type: string;
}

export interface DatabaseTable {
    name: string;
    columns: DatabaseColumn[];
    foreignKeys: string;
    uniqueConstraints: string;
    useUpdatedAtTrigger: boolean;
    usePasswordEncryptionTrigger: boolean;
}

export interface DatabaseConfiguration {
    name: string;
    globalTriggerFunctions: string[];
    tables: DatabaseTable[];
}

export interface TestUser {
    details: {
        name: string;
        email: string;
        password: string;
        mustChangePassword: boolean;
    };
    account: {
        name: string;
        description: string;
    };
    role: {
        name: string;
    };
}

export interface UserAccount {
    user_id: number;
    account_id: number;
    role_id: number;
    team_id: number;
    created_at: Date | string;
    updated_at: Date | string;
}

