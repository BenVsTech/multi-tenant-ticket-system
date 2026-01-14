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

