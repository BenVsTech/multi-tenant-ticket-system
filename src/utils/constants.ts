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