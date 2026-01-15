// Imports

import { DataReturnObject } from "@/types/helper";

// Constants

const tenantTables = ['team', 'team_user', 'ticket', 'comment'];

// Exports

export function validateIdentifier(name: string, type: 'table' | 'column' | 'database'): boolean {
    if (!name || name.length === 0 || name.length > 63) {
        return false;
    }
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

export function validateIdentifierOrError<T>(name: string, type: 'table' | 'column' | 'database'): DataReturnObject<T> | null {
    if (!validateIdentifier(name, type)) {
        return {
            status: false,
            data: null,
            message: `Invalid ${type} name format: '${name}'. Must start with letter/underscore and contain only letters, numbers, and underscores (max 63 chars)`
        } as DataReturnObject<T>;
    }
    return null;
}

export function validateColumnType(type: string): boolean {
    if (!type || type.length === 0 || type.length > 200) {
        return false;
    }

    const baseTypes = [
        'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
        'INTEGER', 'INT', 'BIGINT', 'SMALLINT',
        'VARCHAR', 'CHAR', 'TEXT',
        'TIMESTAMP', 'DATE', 'TIME',
        'INTERVAL',
        'DECIMAL', 'NUMERIC',
        'BOOLEAN', 'BOOL',
        'JSONB', 'JSON',
        'UUID',
        'BYTEA'
    ];
    
    // Modifiers
    const modifiers = [
        'PRIMARY KEY',
        'NOT NULL',
        'NULL',
        'DEFAULT',
        'CURRENT_TIMESTAMP',
        'FALSE',
        'TRUE',
        'UNIQUE'
    ];

    const typePattern = /^[A-Z_]+(\([0-9,\s]+\))?(\s+[A-Z_\s()]+)*$/i;
    
    if (!typePattern.test(type.trim())) {
        return false;
    }

    const baseTypeMatch = type.match(/^([A-Z_]+)/i);
    if (!baseTypeMatch) {
        return false;
    }
    
    const baseType = baseTypeMatch[1].toUpperCase();

    const isValidBaseType = baseTypes.some(allowedType => 
        baseType.startsWith(allowedType) || allowedType.startsWith(baseType)
    );
    
    if (!isValidBaseType) {
        return false;
    }

    const dangerousPatterns = [
        /;/,
        /--/,
        /\/\*/,
        /\*\//,
        /DROP/i,
        /DELETE/i,
        /UPDATE/i,
        /INSERT/i,
        /SELECT/i,
        /EXEC/i,
        /UNION/i,
        /SCRIPT/i,
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(type)) {
            return false;
        }
    }
    
    return true;
}

export function validateColumnTypeOrError<T>(type: string): DataReturnObject<T> | null {
    if (!validateColumnType(type)) {
        return {
            status: false,
            data: null,
            message: `Invalid column type format: '${type}'. Must be a valid PostgreSQL type with allowed modifiers only`
        } as DataReturnObject<T>;
    }
    return null;
}

export function validateForeignKeyConstraint(foreignKeys: string): boolean {
    if (!foreignKeys || foreignKeys.trim().length === 0) {
        return true;
    }
    
    if (foreignKeys.length > 2000) {
        return false;
    }
    
    const foreignKeyPattern = /FOREIGN\s+KEY\s*\([a-zA-Z_][a-zA-Z0-9_]*\)\s+REFERENCES\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([a-zA-Z_][a-zA-Z0-9_]*\)\s*(ON\s+DELETE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))?/gi;
    
    const dangerousPatterns = [
        /;/,
        /--/,
        /\/\*/,
        /\*\//,
        /\bDROP\b/i,
        /\bUPDATE\b/i,
        /\bINSERT\b/i,
        /\bSELECT\b/i,
        /\bEXEC\b/i,
        /\bUNION\b/i,
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(foreignKeys)) {
            return false;
        }
    }
    
    const normalized = foreignKeys.replace(/\s+/g, ' ').trim();
    const parts = normalized.split(/,\s*FOREIGN\s+KEY/i).map((part, index) => {
        if (index === 0) {
            return part.trim();
        }
        return 'FOREIGN KEY' + part.trim();
    }).filter(part => part.length > 0);
    
    for (const part of parts) {
        foreignKeyPattern.lastIndex = 0;
        
        if (!foreignKeyPattern.test(part.trim())) {
            return false;
        }
    }
    
    return true;
}

export function validateForeignKeyConstraintOrError<T>(foreignKeys: string): DataReturnObject<T> | null {
    if (!validateForeignKeyConstraint(foreignKeys)) {
        return {
            status: false,
            data: null,
            message: `Invalid foreign key constraint format. Must be in format: FOREIGN KEY (column) REFERENCES table(column) [ON DELETE action]`
        } as DataReturnObject<T>;
    }
    return null;
}

export function validateUniqueConstraint(uniqueConstraints: string): boolean {
    if (!uniqueConstraints || uniqueConstraints.trim().length === 0) {
        return true;
    }
    
    if (uniqueConstraints.length > 2000) {
        return false;
    }

    const uniquePattern = /UNIQUE\s*\([a-zA-Z_][a-zA-Z0-9_]*(\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*\)/gi;
    
    const dangerousPatterns = [
        /;/,
        /--/,
        /\/\*/,
        /\*\//,
        /\bDROP\b/i,
        /\bDELETE\b/i,
        /\bUPDATE\b/i,
        /\bINSERT\b/i,
        /\bSELECT\b/i,
        /\bEXEC\b/i,
        /\bUNION\b/i,
        /\bFOREIGN\b/i,
        /\bREFERENCES\b/i,
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(uniqueConstraints)) {
            return false;
        }
    }
    
    const normalized = uniqueConstraints.replace(/\s+/g, ' ').trim();
    
    uniquePattern.lastIndex = 0;
    
    let remaining = normalized;
    while (remaining.length > 0) {
        const match = uniquePattern.exec(remaining);
        if (!match) {
            return false;
        }
        remaining = remaining.substring(match.index + match[0].length).trim();
        if (remaining.length > 0 && !remaining.startsWith(',')) {
            return false;
        }
        remaining = remaining.replace(/^,/, '').trim();
    }
    
    return true;
}

export function validateUniqueConstraintOrError<T>(uniqueConstraints: string): DataReturnObject<T> | null {
    if (!validateUniqueConstraint(uniqueConstraints)) {
        return {
            status: false,
            data: null,
            message: `Invalid unique constraint format. Must be in format: UNIQUE (column1, column2, ...)`
        } as DataReturnObject<T>;
    }
    return null;
}

export function validateTenantTable(table: string): DataReturnObject<boolean> {
    if (!tenantTables.includes(table)) {
        return {
            status: false,
            data: null,
            message: `Invalid tenant table name: '${table}'. Must be one of: ${tenantTables.join(', ')}`
        }
    }
    return {
        status: true,
        data: true,
        message: `Table '${table}' is a valid tenant table`
    }
}