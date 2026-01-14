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
  }
}