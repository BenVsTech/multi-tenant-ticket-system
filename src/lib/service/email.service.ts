// Imports

import { createEmailTransporter, EmailTransporter, sendEmail } from "@/lib/core/email";
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