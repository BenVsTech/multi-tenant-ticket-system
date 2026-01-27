// Imports

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { reportIssueEmail } from "@/lib/service/email.service";
import { apiHandler } from "@/lib/core/helper";
import { DataReturnObject } from "@/types/helper";
import { reportIssueSchema, validateRequestBody } from "@/lib/core/zod";
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

        const body = await request.json();

        const validationResult = await validateRequestBody(reportIssueSchema, body);
        if (!validationResult.status || !validationResult.data) {
            return {
                status: false,
                message: validationResult.message,
                data: null
            };
        }

        const { issueType, issueDescription } = validationResult.data;

        const reportIssueResult = await reportIssueEmail(issueType, issueDescription);
        return reportIssueResult;

    }, 'POST /api/report-issue', 201, 400);
}

