// Imports

import { createLocalDatabase } from "@/lib/service/database.service";

// Run Script

(async () => {
    const result = await createLocalDatabase();
    console.log(result.message);
    process.exit(0);
})();
