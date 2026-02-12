/* lib/auth.ts */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export async function authenticateUser(credentials: LoginCredentials): Promise<AuthUser | null> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: credentials.email.toLowerCase().trim(),
      },
    });

    if (!user || !user.hashedPassword) {
      return null;
    }

    // Check password with bcrypt first
    let isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.hashedPassword
    );

    // If bcrypt fails, try plain text comparison (for backward compatibility)
    if (!isPasswordValid) {
      isPasswordValid = user.hashedPassword === credentials.password;
    }

    if (!isPasswordValid) {
      return null;
    }

    // Return user data (without password)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  try {
    // Store plain password (not secure for production!)
    // For development/demo purposes only
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email.toLowerCase().trim(),
        hashedPassword: userData.password, // Storing plain password for demo
        role: userData.role || 'MEMBER',
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error('User creation error:', error);
    return null;
  }
}