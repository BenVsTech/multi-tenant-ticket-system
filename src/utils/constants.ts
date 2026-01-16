// Exports

export const databaseConstants = {
    defaultTimestamp: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    primaryKey: 'SERIAL PRIMARY KEY',
    varchar: (length: number) => `VARCHAR(${length})`,
    integer: 'INTEGER NOT NULL',
    interval: 'INTERVAL',
    date: 'DATE',
    decimal: (precision: number, scale: number) => `DECIMAL(${precision}, ${scale})`,
    boolean: 'BOOLEAN NOT NULL DEFAULT FALSE',
    json: 'JSONB NOT NULL',
}

export const sensitiveFieldPatterns = [
    /password/i,
    /passwd/i,
    /pwd/i,
    /secret/i,
    /token/i,
    /key/i,
    /auth/i,
    /credential/i,
    /api[_-]?key/i,
    /access[_-]?token/i,
    /refresh[_-]?token/i,
    /authorization/i,
    /bearer/i,
    /session/i,
    /cookie/i,
    /connection[_-]?string/i,
    /connectionstring/i,
    /database[_-]?url/i,
    /db[_-]?url/i,
    /redis[_-]?url/i,
    /uri/i,
    /url/i,
];