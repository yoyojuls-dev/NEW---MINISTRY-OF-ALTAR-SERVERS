import { User } from "@prisma/client";

// Safe user type that works with User
export type SafeUser = (
  Omit<User, "createdAt" | "updatedAt" | "emailVerified"> & {
    createdAt: string;
    updatedAt: string;
    emailVerified: string | null;
  }
);
