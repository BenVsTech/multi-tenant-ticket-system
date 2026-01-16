// Imports

import { createTestUser } from "@/lib/service/database.service";
import { testUsers } from "@/utils/local/user";

// Run Script

(async () => {
    const result = await createTestUser(testUsers);
    console.log(result.message);
    process.exit(0);
})();