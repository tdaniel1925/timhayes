import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserSession } from '@/lib/supabase/middleware';

/**
 * AudiaPro Auth Middleware
 *
 * Routing rules:
 * - Unauthenticated users → /login (except public pages)
 * - Super admins → /admin/* pages
 * - Client admins → /dashboard/* pages
 * - Suspended tenant → /suspended page
 * - Wrong role for route → /unauthorized
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get user session and database record
  const { user, userRecord, response } = await getUserSession(request);

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/unauthorized', '/suspended'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Landing page is public
  if (pathname === '/') {
    return response;
  }

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated but no user record in database (shouldn't happen)
  if (user && !userRecord && !isPublicRoute) {
    console.error(`User ${user.id} authenticated but no database record found`);
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // If authenticated and trying to access login page, redirect to appropriate dashboard
  if (user && userRecord && pathname.startsWith('/login')) {
    const dashboardUrl = userRecord.role === 'super_admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // Allow access to public routes
  if (isPublicRoute) {
    return response;
  }

  // If we reach here, user is authenticated and has a valid record
  if (!userRecord) {
    return response; // Shouldn't happen, but satisfy TypeScript
  }

  // TODO: Check if user is active when is_active column is added to users table
  // if (!userRecord.is_active) {
  //   return NextResponse.redirect(new URL('/unauthorized', request.url));
  // }

  // Check tenant status for client admins
  if (userRecord.role === 'client_admin' && userRecord.tenant_id) {
    // We'll need to check tenant status - for now, assume active
    // TODO: Query tenant status and redirect to /suspended if needed
  }

  // Role-based route protection
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // Super admins trying to access dashboard → allow (they can view everything)
  // Client admins trying to access admin routes → unauthorized
  if (isAdminRoute && userRecord.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Client admins can only access dashboard routes
  if (isDashboardRoute && userRecord.role === 'client_admin') {
    return response;
  }

  // Super admins can access both admin and dashboard routes
  if (userRecord.role === 'super_admin') {
    return response;
  }

  // Default: allow the request
  return response;
}

/**
 * Matcher configuration
 * Apply middleware to all routes except:
 * - Static files (_next/static)
 * - Images (_next/image)
 * - Favicon and public files
 * - API routes (handled separately with their own auth)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
