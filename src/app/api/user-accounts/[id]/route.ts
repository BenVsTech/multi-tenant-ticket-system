// Imports

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/core/auth";
import { apiHandler } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { validateRequestBody, validateRouteParams, changePasswordSchema, userIdParamSchema } from "@/lib/core/zod";
import { changeUserPassword } from "@/lib/service/user.account.service";

// Exports

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<DataReturnObject<boolean>>> {
    return apiHandler<boolean>(async () => {

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return {
                status: false,
                message: 'Unauthorized',
                data: null
            };
        }

        const routeParams = await params;
        const paramsValidationResult = await validateRouteParams(userIdParamSchema, routeParams);
        if (!paramsValidationResult.status || !paramsValidationResult.data) {
            return {
                status: false,
                message: paramsValidationResult.message,
                data: null
            };
        }

        const userId = paramsValidationResult.data.id;
        const sessionUserId = parseInt(session.user.id);

        if (userId !== sessionUserId) {
            return {
                status: false,
                message: 'You can only change your own password',
                data: null
            };
        }

        const body = await request.json();
        
        const validationResult = await validateRequestBody(changePasswordSchema, body);
        if (!validationResult.status || !validationResult.data) {
            return {
                status: false,
                message: validationResult.message,
                data: null
            };
        }

        const { currentPassword, newPassword } = validationResult.data;
        
        const changeUserPasswordResult = await changeUserPassword(userId, currentPassword, newPassword);
        if (!changeUserPasswordResult.status || !changeUserPasswordResult.data) {
            return {
                status: false,
                message: changeUserPasswordResult.message,
                data: null
            };
        }
        
        return {
            status: true,
            message: 'Password changed successfully',
            data: true
        };

    }, 'PATCH /api/user-accounts/[id]', 200, 400);
}

