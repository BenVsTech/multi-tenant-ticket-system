// Imports

import { NextRequest, NextResponse } from "next/server";
import { deleteUserFromSystem } from "@/lib/service/user.service";
import { apiHandler } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";

// Exports

export async function DELETE(request: NextRequest): Promise<NextResponse<DataReturnObject<boolean>>> {
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

        const deleteUserResult = await deleteUserFromSystem(userId);
        if(!deleteUserResult.status || !deleteUserResult.data) {
            return {
                status: false,
                data: null,
                message: deleteUserResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: 'Your account has been deleted successfully'
        };

    }, 'DELETE /api/users/me/delete', 200, 400);
}

