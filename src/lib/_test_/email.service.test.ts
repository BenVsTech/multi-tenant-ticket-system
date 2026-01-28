// Imports

import { sendEmailToUser, reportIssueEmail } from '@/lib/service/email.service';
import { createEmailTransporter, sendEmail, sendEmailToSystem, EmailTransporter } from '@/lib/core/email';

// Mock all dependencies

jest.mock('@/lib/core/email', () => ({
    createEmailTransporter: jest.fn(),
    sendEmail: jest.fn(),
    sendEmailToSystem: jest.fn(),
}));

// Tests for Email Service

describe('Email Service', () => {
    let mockTransporter: jest.Mocked<EmailTransporter>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockTransporter = {
            sendMail: jest.fn(),
        } as unknown as jest.Mocked<EmailTransporter>;
    });

    describe('sendEmailToUser', () => {
        it('should send email to user successfully', async () => {
            const to = 'test@example.com';
            const subject = 'Test Subject';
            const text = 'Test email body';

            (createEmailTransporter as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTransporter,
                message: 'Transporter created'
            });

            (sendEmail as jest.Mock).mockResolvedValueOnce({
                status: true,
                message: 'Email sent successfully'
            });

            const result = await sendEmailToUser(to, subject, text);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Email sent successfully');
            expect(createEmailTransporter).toHaveBeenCalled();
            expect(sendEmail).toHaveBeenCalledWith(mockTransporter, to, subject, text);
        });

        it('should return error when transporter creation fails', async () => {
            const to = 'test@example.com';
            const subject = 'Test Subject';
            const text = 'Test email body';

            (createEmailTransporter as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to create transporter'
            });

            const result = await sendEmailToUser(to, subject, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create transporter');
            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('should return error when sending email fails', async () => {
            const to = 'test@example.com';
            const subject = 'Test Subject';
            const text = 'Test email body';

            (createEmailTransporter as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTransporter,
                message: 'Transporter created'
            });

            (sendEmail as jest.Mock).mockResolvedValueOnce({
                status: false,
                message: 'Failed to send email'
            });

            const result = await sendEmailToUser(to, subject, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to send email');
        });

        it('should handle exceptions and return error message', async () => {
            const to = 'test@example.com';
            const subject = 'Test Subject';
            const text = 'Test email body';

            (createEmailTransporter as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await sendEmailToUser(to, subject, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Unexpected error');
        });

        it('should handle unknown error types', async () => {
            const to = 'test@example.com';
            const subject = 'Test Subject';
            const text = 'Test email body';

            (createEmailTransporter as jest.Mock).mockRejectedValueOnce('String error');

            const result = await sendEmailToUser(to, subject, text);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Unknown error while sending email to user');
        });
    });

    describe('reportIssueEmail', () => {
        it('should send issue report email successfully', async () => {
            const issueType = 'Bug Report';
            const issueDescription = 'The application crashes when clicking the button';

            (createEmailTransporter as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTransporter,
                message: 'Transporter created'
            });

            (sendEmailToSystem as jest.Mock).mockResolvedValueOnce({
                status: true,
                message: 'Issue report sent successfully'
            });

            const result = await reportIssueEmail(issueType, issueDescription);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Issue report sent successfully');
            expect(createEmailTransporter).toHaveBeenCalled();
            expect(sendEmailToSystem).toHaveBeenCalledWith(
                mockTransporter,
                'New Issue Reported',
                expect.stringContaining(issueType),
                expect.stringContaining(issueDescription)
            );
        });

        it('should return error when transporter creation fails', async () => {
            const issueType = 'Bug Report';
            const issueDescription = 'The application crashes when clicking the button';

            (createEmailTransporter as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to create transporter'
            });

            const result = await reportIssueEmail(issueType, issueDescription);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create transporter');
            expect(sendEmailToSystem).not.toHaveBeenCalled();
        });

        it('should return error when sending email fails', async () => {
            const issueType = 'Bug Report';
            const issueDescription = 'The application crashes when clicking the button';

            (createEmailTransporter as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTransporter,
                message: 'Transporter created'
            });

            (sendEmailToSystem as jest.Mock).mockResolvedValueOnce({
                status: false,
                message: 'Failed to send email'
            });

            const result = await reportIssueEmail(issueType, issueDescription);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to send email');
        });

        it('should format issue email correctly', async () => {
            const issueType = 'Feature Request';
            const issueDescription = 'Add dark mode support';

            (createEmailTransporter as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockTransporter,
                message: 'Transporter created'
            });

            (sendEmailToSystem as jest.Mock).mockResolvedValueOnce({
                status: true,
                message: 'Issue report sent successfully'
            });

            await reportIssueEmail(issueType, issueDescription);

            expect(sendEmailToSystem).toHaveBeenCalledWith(
                mockTransporter,
                'New Issue Reported',
                expect.stringContaining(`Issue Type: ${issueType}`),
                expect.stringContaining(issueDescription)
            );
        });

        it('should handle exceptions and return error message', async () => {
            const issueType = 'Bug Report';
            const issueDescription = 'The application crashes when clicking the button';

            (createEmailTransporter as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await reportIssueEmail(issueType, issueDescription);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Unexpected error');
        });

        it('should handle unknown error types', async () => {
            const issueType = 'Bug Report';
            const issueDescription = 'The application crashes when clicking the button';

            (createEmailTransporter as jest.Mock).mockRejectedValueOnce('String error');

            const result = await reportIssueEmail(issueType, issueDescription);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Unknown error while sending report issue email');
        });
    });
});

