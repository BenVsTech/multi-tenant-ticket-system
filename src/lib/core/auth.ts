// Imports

import dotenv from "dotenv";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase, closeDatabaseConnection, DatabaseClient } from "@/lib/core/database";
import { authorizeUser } from "@/lib/core/database/queries";
import { authLimiter } from "@/lib/core/rateLimit";

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

        const emailKey = `auth:${credentials.email.toLowerCase()}`;
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

          const authorizeUserResult = await authorizeUser(dbClient, credentials.email, credentials.password);
          if (!authorizeUserResult.status || !authorizeUserResult.data) {
            return null;
          }

          return {
            id: String(authorizeUserResult.data.id),
            email: authorizeUserResult.data.email,
            name: authorizeUserResult.data.name,
            roles: authorizeUserResult.data.roles,
          };

        } catch (error) {
          console.error("Auth error:", error);
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
    maxAge: 2 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.roles = token.roles;
      }
      return session;
    },
  },
};