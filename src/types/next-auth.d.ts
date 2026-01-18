// Imports

import "next-auth";

// Declarations

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: {
        accountId: number;
        accountName: string;
        role: string;
        permissions: string[];
      }[];
      mustChangePassword?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    roles: {
      accountId: number;
      accountName: string;
      role: string;
      permissions: string[];
    }[];
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    roles: {
      accountId: number;
      accountName: string;
      role: string;
      permissions: string[];
    }[];
    mustChangePassword?: boolean;
  }
}