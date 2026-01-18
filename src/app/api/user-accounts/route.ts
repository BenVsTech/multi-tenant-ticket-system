// Imports

import { NextResponse } from "next/server";
import { createUserAccount } from "@/lib/service/user.account.service";
import { apiHandler } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { createUserAccountSchema, validateRequestBody } from "@/lib/core/zod";

// Exports

export async function POST(request: Request): Promise<NextResponse<DataReturnObject<boolean>>> {
    return apiHandler<boolean>(async () => {

        const body = await request.json();

        const validationResult = await validateRequestBody(createUserAccountSchema, body);
        if (!validationResult.status || !validationResult.data) {
            return {
                status: false,
                message: validationResult.message,
                data: null
            };
        }

        const { name, email } = validationResult.data;

        const createUserAccountResult = await createUserAccount(name, email);
        return createUserAccountResult;

    }, 'POST /api/user-accounts', 201, 400);
}

