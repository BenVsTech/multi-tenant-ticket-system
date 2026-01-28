// Imports

import { createUserAccount, changeUserPassword } from '@/lib/service/user.account.service';
import { connectToDatabase, DatabaseClient } from '@/lib/core/database';
import { checkPassword, dynamicSendData, getRowById, getRowsByColumnValue, updateRowById } from '@/lib/core/database/queries';
import { handleCloseDatabaseConnections, generatePassword } from '@/lib/core/helper';
import { sendEmailToUser } from '@/lib/service/email.service';

// Mock all dependencies

jest.mock('@/lib/core/database', () => ({
    connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/core/database/queries', () => ({
    checkPassword: jest.fn(),
    dynamicSendData: jest.fn(),
    getRowById: jest.fn(),
    getRowsByColumnValue: jest.fn(),
    updateRowById: jest.fn(),
}));

jest.mock('@/lib/core/helper', () => ({
    handleCloseDatabaseConnections: jest.fn(),
    generatePassword: jest.fn(),
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('@/lib/service/email.service', () => ({
    sendEmailToUser: jest.fn(),
}));

// Tests for User Account Service

describe('User Account Service', () => {
    let mockDbClient: jest.Mocked<DatabaseClient>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDbClient = {
            query: jest.fn(),
            release: jest.fn(),
        } as unknown as jest.Mocked<DatabaseClient>;
    });

    describe('createUserAccount', () => {
        it('should create user account successfully', async () => {
            const name = 'Test User';
            const email = 'test@example.com';
            const mockPassword = 'generatedPassword123';
            const mockUserId = 10;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (generatePassword as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockPassword,
                message: 'Password generated'
            });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'User not found'
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUserId,
                message: 'User created'
            });

            (sendEmailToUser as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Email sent'
            });

            const result = await createUserAccount(name, email);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('User created successfully');
            expect(generatePassword).toHaveBeenCalled();
            expect(getRowsByColumnValue).toHaveBeenCalledWith(mockDbClient, 'users', 'email', email.toLowerCase().trim());
            expect(dynamicSendData).toHaveBeenCalledWith(
                mockDbClient,
                'users',
                ['name', 'email', 'password', 'must_change_password'],
                [name, email.toLowerCase().trim(), mockPassword, true]
            );
            expect(sendEmailToUser).toHaveBeenCalledWith(
                email,
                'Welcome to our platform',
                `Your password is: ${mockPassword}`
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const name = 'Test User';
            const email = 'test@example.com';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await createUserAccount(name, email);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(generatePassword).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when password generation fails', async () => {
            const name = 'Test User';
            const email = 'test@example.com';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (generatePassword as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to generate password'
            });

            const result = await createUserAccount(name, email);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to generate password');
            expect(getRowsByColumnValue).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when user already exists', async () => {
            const name = 'Test User';
            const email = 'existing@example.com';
            const mockPassword = 'generatedPassword123';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (generatePassword as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockPassword,
                message: 'Password generated'
            });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [{ id: 1, email: email.toLowerCase().trim() }],
                message: 'User found'
            });

            const result = await createUserAccount(name, email);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('An account with this email already exists. If this is your account, please try logging in or resetting your password.');
            expect(dynamicSendData).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when creating user fails', async () => {
            const name = 'Test User';
            const email = 'test@example.com';
            const mockPassword = 'generatedPassword123';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (generatePassword as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockPassword,
                message: 'Password generated'
            });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'User not found'
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to create user'
            });

            const result = await createUserAccount(name, email);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to create user');
            expect(sendEmailToUser).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when sending email fails', async () => {
            const name = 'Test User';
            const email = 'test@example.com';
            const mockPassword = 'generatedPassword123';
            const mockUserId = 10;

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (generatePassword as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockPassword,
                message: 'Password generated'
            });

            (getRowsByColumnValue as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: [],
                message: 'User not found'
            });

            (dynamicSendData as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUserId,
                message: 'User created'
            });

            (sendEmailToUser as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to send email'
            });

            const result = await createUserAccount(name, email);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to send email');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const name = 'Test User';
            const email = 'test@example.com';

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await createUserAccount(name, email);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });

    describe('changeUserPassword', () => {
        it('should change password successfully', async () => {
            const userId = 1;
            const currentPassword = 'oldPassword123';
            const newPassword = 'newPassword456';
            const mockUser = {
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedOldPassword',
                must_change_password: false,
                created_at: new Date(),
                updated_at: new Date()
            };

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUser,
                message: 'User found'
            });

            (checkPassword as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Password verified'
            });

            (updateRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Password updated'
            });

            const result = await changeUserPassword(userId, currentPassword, newPassword);

            expect(result.status).toBe(true);
            expect(result.data).toBe(true);
            expect(result.message).toBe('Password changed successfully');
            expect(getRowById).toHaveBeenCalledWith(mockDbClient, 'users', userId);
            expect(checkPassword).toHaveBeenCalledWith(mockDbClient, mockUser.email, currentPassword);
            expect(updateRowById).toHaveBeenCalledWith(
                mockDbClient,
                'users',
                ['password', 'must_change_password'],
                [newPassword, false],
                userId
            );
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when database connection fails', async () => {
            const userId = 1;
            const currentPassword = 'oldPassword123';
            const newPassword = 'newPassword456';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Connection failed'
            });

            const result = await changeUserPassword(userId, currentPassword, newPassword);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Connection failed');
            expect(getRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });

        it('should return error when user not found', async () => {
            const userId = 1;
            const currentPassword = 'oldPassword123';
            const newPassword = 'newPassword456';

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'User not found'
            });

            const result = await changeUserPassword(userId, currentPassword, newPassword);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('User not found');
            expect(checkPassword).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when current password is incorrect', async () => {
            const userId = 1;
            const currentPassword = 'wrongPassword';
            const newPassword = 'newPassword456';
            const mockUser = {
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedOldPassword',
                must_change_password: false,
                created_at: new Date(),
                updated_at: new Date()
            };

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUser,
                message: 'User found'
            });

            (checkPassword as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: false,
                message: 'Password incorrect'
            });

            const result = await changeUserPassword(userId, currentPassword, newPassword);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Current password is incorrect');
            expect(updateRowById).not.toHaveBeenCalled();
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should return error when update fails', async () => {
            const userId = 1;
            const currentPassword = 'oldPassword123';
            const newPassword = 'newPassword456';
            const mockUser = {
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedOldPassword',
                must_change_password: false,
                created_at: new Date(),
                updated_at: new Date()
            };

            (connectToDatabase as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockDbClient,
                message: 'Connected to database'
            });

            (getRowById as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: mockUser,
                message: 'User found'
            });

            (checkPassword as jest.Mock).mockResolvedValueOnce({
                status: true,
                data: true,
                message: 'Password verified'
            });

            (updateRowById as jest.Mock).mockResolvedValueOnce({
                status: false,
                data: null,
                message: 'Failed to update password'
            });

            const result = await changeUserPassword(userId, currentPassword, newPassword);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Failed to update password');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, mockDbClient);
        });

        it('should handle exceptions and return error message', async () => {
            const userId = 1;
            const currentPassword = 'oldPassword123';
            const newPassword = 'newPassword456';

            (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

            const result = await changeUserPassword(userId, currentPassword, newPassword);

            expect(result.status).toBe(false);
            expect(result.data).toBe(null);
            expect(result.message).toBe('Database operation failed');
            expect(handleCloseDatabaseConnections).toHaveBeenCalledWith(null, null);
        });
    });
});

