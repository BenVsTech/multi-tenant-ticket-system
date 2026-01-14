// Imports

import NextAuth from "next-auth";
import { authOptions } from "@/lib/core/auth";

// Functions

const handler = NextAuth(authOptions);

// Exports

export { handler as GET, handler as POST };