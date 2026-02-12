// types/next-auth.d.ts - NextAuth type definitions
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userType?: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    userType?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType?: string;
    role?: string;
  }
}