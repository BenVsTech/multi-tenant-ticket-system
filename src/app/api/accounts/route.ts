// Imports

import { NextResponse } from "next/server";
import { createUserAccount } from "@/lib/service/user.account.service";
import { logger } from "@/lib/core/helper";

// Exports

export async function POST(request: Request): Promise<NextResponse> {
    try{

        const body = await request.json();
        const { name, email } = body;

        if(!name || !email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }

        const createUserAccountResult = await createUserAccount(name, email);
        if(!createUserAccountResult.status) {
            return NextResponse.json({ error: createUserAccountResult.message }, { status: 400 });
        }

        return NextResponse.json({ message: createUserAccountResult.message }, { status: 200 });

    } catch(error: unknown) {
        logger.error('POST /api/accounts', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

