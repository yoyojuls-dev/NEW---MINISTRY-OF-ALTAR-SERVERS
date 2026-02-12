import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import prisma from "@/libs/prismadb";

export async function getSession() {
  return await getServerSession(authOptions);
}

export default async function getCurrentStudent() {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return null;
    }

    // Check if user is not admin (i.e., student)
    if ((session.user as any).role === "ADMIN") {
      return null;
    }

    const currentStudent = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!currentStudent) {
      return null;
    }

    return {
      ...currentStudent,
      createdAt: currentStudent.createdAt.toISOString(),
      updatedAt: currentStudent.updatedAt.toISOString(),
      emailVerified: currentStudent.emailVerified?.toISOString() || null,
    };
  } catch (error: any) {
    console.log(error);
    return null;
  }
}