// Imports

import dotenv from "dotenv";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase, closeDatabaseConnection, DatabaseClient } from "@/lib/core/database";
import { authorizeUser, getRowById, getUserRoles } from "@/lib/core/database/queries";
import { authLimiter } from "@/lib/core/rateLimit";
import { logger } from "./helper";

// Load Environment Variables

dotenv.config();

// Environment Variables

const secret = process.env.NEXTAUTH_SECRET;

if(!secret || secret.length < 32) {
  throw new Error("NEXTAUTH_SECRET is not set or is not at least 32 characters long");
}

// Exports

export const authOptions: NextAuthOptions = {
  secret: secret,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          return null;
        }

        const emailKey = `auth:${normalizedEmail}`;
        const rateLimitResult = await authLimiter.check(5, emailKey);

        if (!rateLimitResult.success) {
          return null;
        }

        let dbClient: DatabaseClient | null = null;
        try {

          const connection = await connectToDatabase(false);
          if (!connection.status || !connection.data) {
            return null;
          }

          dbClient = connection.data;

          const authorizeUserResult = await authorizeUser(dbClient, normalizedEmail, credentials.password);
          if (!authorizeUserResult.status || !authorizeUserResult.data) {
            return null;
          }

          return {
            id: String(authorizeUserResult.data.id),
            email: authorizeUserResult.data.email,
            name: authorizeUserResult.data.name,
            roles: authorizeUserResult.data.roles,
            mustChangePassword: authorizeUserResult.data.mustChangePassword || false,
          };

        } catch (error) {
          logger.error('Auth', error);
          return null;
        } finally {
          if (dbClient) {
            await closeDatabaseConnection(dbClient);
          }
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roles = user.roles;
        token.mustChangePassword = (user as any).mustChangePassword || false;
      }
      
      if (trigger === "update" && token.id) {
        let dbClient: DatabaseClient | null = null;
        try {
          const connection = await connectToDatabase(false);
          if (connection.status && connection.data) {
            dbClient = connection.data;
            const userId = parseInt(token.id as string);
            const userResult = await getRowById(dbClient, 'users', userId);
            
            if (userResult.status && userResult.data) {
              token.mustChangePassword = userResult.data.must_change_password === true;
              const rolesResult = await getUserRoles(dbClient, userId);
              if (rolesResult.status && rolesResult.data) {
                token.roles = rolesResult.data;
              }
            }
          }
        } catch (error) {
          logger.error('JWT Update', error);
        } finally {
          if (dbClient) {
            await closeDatabaseConnection(dbClient);
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.roles = token.roles;
        session.user.mustChangePassword = (token.mustChangePassword as boolean) || false;
      }
      return session;
    },
  },
};