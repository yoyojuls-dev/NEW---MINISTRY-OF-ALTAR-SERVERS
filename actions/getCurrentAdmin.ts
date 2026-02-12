import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import prisma from "@/libs/prismadb";

export async function getSession() {
  return await getServerSession(authOptions);
}

export default async function getCurrentAdmin() {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return null;
    }

    // Check if user is admin type
    if ((session.user as any).role !== "ADMIN") {
      return null;
    }

    const currentAdmin = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!currentAdmin) {
      return null;
    }

    return {
      ...currentAdmin,
      createdAt: currentAdmin.createdAt.toISOString(),
      updatedAt: currentAdmin.updatedAt.toISOString(),
      emailVerified: currentAdmin.emailVerified?.toISOString() || null,
    };
  } catch (error: any) {
    console.log(error);
    return null;
  }
}