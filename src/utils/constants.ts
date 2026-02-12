// Exports

export const databaseConstants = {
    defaultTimestamp: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    timestamp: 'TIMESTAMP',
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

export const statusOptions = ['Unassigned', 'Backlog', 'On Hold', 'Blocked', 'Cancelled', 'In Progress', 'Completed', 'Archived', 'Total'];

export const statusColors: Record<string, string> = {
    'Unassigned': '#A8A8D8',
    'Backlog': '#B3A1FF',
    'In Progress': '#FFC966',
    'On Hold': '#FF8A8A',
    'Blocked': '#C0C0C0',
    'Cancelled': '#5BA3F5',
    'Completed': '#6DD4A8',
    'Archived': '#808080'
};

export const teamColors = ['#6B9BD2', '#7BC8A4', '#B19CD9', '#5DB3B3', '#9BC4E2', '#A8D5BA', '#C4A8D9', '#7BC8C8'];

export const statusOrder = ['Unassigned', 'Backlog', 'In Progress', 'On Hold', 'Blocked', 'Cancelled', 'Completed', 'Archived'];