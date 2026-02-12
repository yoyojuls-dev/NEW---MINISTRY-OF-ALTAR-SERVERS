import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = request.nextUrl;

  // DEBUG: Log every request
  console.log("🔍 Middleware - Path:", pathname);
  console.log("🔍 Middleware - Token exists:", !!token);
  console.log("🔍 Middleware - Role:", token?.role);

  // Allow access to login and register pages without authentication
  const publicRoutes = [
    '/admin/login',
    '/admin/register',
    '/student/login',
    '/student/register',
    '/',
  ];

  // If accessing a public route, allow it
  if (publicRoutes.includes(pathname)) {
    console.log("✅ Public route - allowing access");
    
    // If already logged in and trying to access login pages, redirect to dashboard
    // EXCEPT for admin login - allow access to login page even if logged in
    if (token && pathname.includes('/login') && pathname !== '/admin/login') {
      console.log("🔄 Already logged in, redirecting to dashboard");
      if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/student/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected admin routes
  const adminRoutes = [
    '/admin',
    '/admin/add-thesis',
    '/admin/manage-thesis',
    '/admin/pending-thesis',
    '/admin/categories',
    '/admin/files',
    '/admin/users',
    '/admin/analytics',
    '/admin/reports',
    '/admin/settings'
  ];

  // Protected student routes
  const studentRoutes = [
    '/student/dashboard',
    '/student/browse',
    '/student/categories',
    '/student/favorites',
    '/student/downloads',
    '/student/settings',
    '/student/profile'
  ];

  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isStudentRoute = studentRoutes.some(route => pathname.startsWith(route));

  // Redirect logic for protected routes
  if (isAdminRoute && !token) {
    console.log("🔒 Protected admin route without token - redirecting to login");
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (isStudentRoute && !token) {
    console.log("🔒 Protected student route without token - redirecting to login");
    return NextResponse.redirect(new URL('/student/login', request.url));
  }

  if (isAdminRoute && token && token.role !== 'ADMIN') {
    console.log("⛔ Non-admin accessing admin route - redirecting");
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  if (isStudentRoute && token && token.role === 'ADMIN') {
    console.log("⛔ Admin accessing student route - redirecting");
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  console.log("✅ Allowing request");
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};