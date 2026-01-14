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
    };
    account: {
        name: string;
        description: string;
    };
    role: {
        name: string;
    };
}

