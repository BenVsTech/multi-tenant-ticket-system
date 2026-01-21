// Imports

import { TestUser } from "@/types/database";

// Exports

export const testUsers : TestUser = {
    details: {
        name: 'Test User',
        email: 'test@test.com',
        password: 'test',
        mustChangePassword: false
    }, 
    account: {
        name: 'Test Account',
        description: 'Test Account Description'
    },
    role: {
        name: 'owner'
    }
}

