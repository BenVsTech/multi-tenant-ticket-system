// Imports

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { DataReturnObject } from '@/types/helper';

// Load Environment Variables

dotenv.config();

// Environment Variables

const emailUser = process.env.SMTP_USER;
const emailPassword = process.env.SMTP_PASS;
const emailService = process.env.SMTP_SERV;

if(!emailUser || !emailPassword || !emailService) {
    throw new Error('Missing environment variables');
}

// Exporting Types

export type EmailTransporter = nodemailer.Transporter;

// Exports

export async function createEmailTransporter(): Promise<DataReturnObject<nodemailer.Transporter>> {
    try{

        const transporter = nodemailer.createTransport({
            service: emailService,
            auth: {
                user: emailUser,
                pass: emailPassword,
            },
        })

        return {
            status: true,
            data: transporter,
            message: 'Email transporter created successfully'
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while creating email transporter'
        };
    }
}

export async function sendEmail(transporter: nodemailer.Transporter, to: string, subject: string, text: string): Promise<DataReturnObject<boolean>> {
    try{

        const info = await transporter.sendMail({
            from: `"${emailUser}" <${emailUser}>`,
            to: to,
            subject: subject,
            text: text,
        });

        if(!info.messageId) {
            return {
                status: false,
                data: null,
                message: 'Email not sent'
            };
        }

        return {
            status: true,
            data: true,
            message: 'Email sent successfully'
        };

    } catch(error: unknown) {
        return {
            status: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error while sending email'
        };
    }
}
