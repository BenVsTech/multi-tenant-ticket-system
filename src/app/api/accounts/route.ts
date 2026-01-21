// Imports

import { NextResponse } from "next/server";
import { createAccount } from "@/lib/service/account.service";
import { apiHandler } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { createAccountSchema, validateRequestBody } from "@/lib/core/zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";

// Exports

export async function POST(request: Request): Promise<NextResponse<DataReturnObject<boolean>>> {
    return apiHandler<boolean>(async () => {

        const session = await getServerSession(authOptions);
        if(!session?.user?.id) {
            return {
                status: false,
                data: null,
                message: 'Unauthorized'
            };
        }

        const userId = parseInt(session.user.id);

        const body = await request.json();

        const validationResult = await validateRequestBody(createAccountSchema, body);
        if(!validationResult.status || !validationResult.data) {
            return {
                status: false,
                data: null,
                message: validationResult.message
            };
        }

        const { name, description } = validationResult.data;

        const createAccountResult = await createAccount(userId, name, description);
        if(!createAccountResult.status || !createAccountResult.data) {
            return {
                status: false,
                data: null,
                message: createAccountResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Account created successfully'
        }

    }, 'POST /api/accounts', 201, 400);
}

