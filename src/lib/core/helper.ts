// Imports

import { DatabaseClient } from "./database";
import { closeDatabaseConnection } from "./database";

// Exports

export async function handleCloseDatabaseConnections(temporaryDbClient: DatabaseClient | null, dbClient: DatabaseClient | null): Promise<void> {
    const closePromises: Promise<void>[] = [];

    if (temporaryDbClient) {
        closePromises.push(
            closeDatabaseConnection(temporaryDbClient).then(() => {})
        );
    }

    if (dbClient) {
        closePromises.push(
            closeDatabaseConnection(dbClient).then(() => {})
        );
    }

    await Promise.all(closePromises);
}

