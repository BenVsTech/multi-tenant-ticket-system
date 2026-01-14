// Imports

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase, closeDatabaseConnection, DatabaseClient } from "@/lib/core/database";
import { checkPassword, getRowsByColumnValue, getRowById } from "@/lib/core/database/queries";

// Exports

export const authOptions: NextAuthOptions = {
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

        let dbClient: DatabaseClient | null = null;
        try {

          const connection = await connectToDatabase(false);
          if (!connection.status || !connection.data) {
            return null;
          }

          dbClient = connection.data;

          const passwordCheckResult = await checkPassword(dbClient, credentials.email, credentials.password);
          if (!passwordCheckResult.status || !passwordCheckResult.data) {
            return null;
          }

          const userResult = await getRowById(dbClient, 'users', parseInt(passwordCheckResult.data));
          if (!userResult.status || !userResult.data) {
            return null;
          }

          const user = userResult.data;

          const userAccountResult = await getRowsByColumnValue(dbClient, 'user_account', 'user_id', user.id.toString());
          if (!userAccountResult.status || !userAccountResult.data) {
            return null;
          }

          const userAccounts = userAccountResult.data;

          const roles = (await Promise.all(userAccounts.map(async (userAccount: any) => {

            let permissions: string[] = [];

            if (!dbClient) {
              return null;
            }

            const roleResult = await getRowById(dbClient, 'role', userAccount.role_id);
            if (!roleResult.status || !roleResult.data) {
              return null;
            }

            const role = roleResult.data;

            const rolePermissionsResult = await getRowsByColumnValue(dbClient, 'role_permission', 'role_id', role.id.toString());
            if (!rolePermissionsResult.status || !rolePermissionsResult.data) {
              return null;
            }

            const permissionIds = rolePermissionsResult.data.map((rolePermission: any) => rolePermission.permission_id);

            for (const permissionId of permissionIds) {

            const permissionResult = await getRowById(dbClient, 'permission', permissionId);
            if (!permissionResult.status || !permissionResult.data) {
                continue;
              }

              const permission = permissionResult.data;
              permissions.push(permission.name);
            }

            const accountResult = await getRowById(dbClient, 'account', userAccount.account_id);
            if (!accountResult.status || !accountResult.data) {
              return null;
            }

            const account = accountResult.data;

            return {
              accountId: userAccount.account_id,
              accountName: account.name,
              role: role.name,
              permissions: permissions,
            };

          }))).filter((role): role is NonNullable<typeof role> => role !== null)

          return {
            id: passwordCheckResult.data,
            email: user.email,
            name: user.name,
            roles: roles,
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