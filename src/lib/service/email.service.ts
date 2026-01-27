// Imports

import { createEmailTransporter, EmailTransporter, sendEmail, sendEmailToSystem } from "@/lib/core/email";
import { DataReturnObject } from "@/types/helper";

// Exports

export async function sendEmailToUser(to: string, subject: string, text: string): Promise<DataReturnObject<boolean>> {

    let transporter: EmailTransporter | null = null;

    try{

        const transporterResult = await createEmailTransporter();
        if(!transporterResult.status) {
            return {
                status: false,
                data: null,
                message: transporterResult.message
            };
        }

        transporter = transporterResult.data as EmailTransporter;

        const sendEmailResult = await sendEmail(transporter, to, subject, text);
        if(!sendEmailResult.status) {
            return {
                status: false,
                data: null,
                message: sendEmailResult.message
            };
        }
        
        return {
            status: true,
            data: true,
            message: sendEmailResult.message
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while sending email to user'
        };
    }
}

export async function reportIssueEmail(issueType: string, issueDescription: string): Promise<DataReturnObject<boolean>> {

    let transporter: EmailTransporter | null = null;

    try{

        const transporterResult = await createEmailTransporter();
        if(!transporterResult.status) {
            return {
                status: false,
                data: null,
                message: transporterResult.message
            };
        }

        transporter = transporterResult.data as EmailTransporter;
        
        const plainText = `Issue Type: ${issueType}\nIssue Description: ${issueDescription}`;
        const htmlContent = `
            <p><strong>Issue Type:</strong> ${issueType}</p>
            <p><strong>Issue Description:</strong> ${issueDescription}</p>
        `;

        const sendEmailResult = await sendEmailToSystem(transporter, 'New Issue Reported', plainText, htmlContent);
        if(!sendEmailResult.status) {
            return {
                status: false,
                data: null,
                message: sendEmailResult.message
            };
        }

        return {
            status: true,
            data: true,
            message: sendEmailResult.message
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while sending report issue email'
        };
    }
}