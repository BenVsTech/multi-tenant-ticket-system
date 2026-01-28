// Imports

import { NextResponse } from "next/server";
import { getRoles } from "@/lib/service/role.service";
import { apiHandler } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";

// Exports

export async function GET(request: Request): Promise<NextResponse<DataReturnObject<{id: number, name: string, description: string}[]>>> {
    return apiHandler<{id: number, name: string, description: string}[]>(async () => {

        const getRolesResult = await getRoles();
        if(!getRolesResult.status || !getRolesResult.data) {
            return {
                status: false,
                data: null,
                message: getRolesResult.message
            };
        }

        return {
            status: true,
            data: getRolesResult.data,
            message: getRolesResult.message
        };

    }, 'GET /api/roles', 200, 400);
}

