import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const baseUrl = () => process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';


const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/verify',
    '/pricing',
    '/api/auth',
    '/api/webhooks',
    '/connect',
];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log(`[Middleware] Request: ${request.method} ${pathname}`);

    // Allow public routes
    const isPublic = publicRoutes.some(route => pathname.startsWith(route));
    if (isPublic) {
        return NextResponse.next();
    }

    // Allow static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check authentication
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        console.log(`[Middleware] No token found for ${pathname}, redirecting to login`);
        const loginUrl = new URL('/auth/login', baseUrl());
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Aggressive Superadmin Redirection
    if (token.role === 'SUPERADMIN') {
        console.log(`[Middleware] Superadmin check for ${pathname}`);
        if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !isPublic) {
            console.log(`[Middleware] Superadmin redirecting ${pathname} to /admin/dashboard`);
            return NextResponse.redirect(new URL('/admin/dashboard', baseUrl()));
        }
    } else if (pathname.startsWith('/admin')) {
        // Prevent regular users from accessing admin routes
        return NextResponse.redirect(new URL('/dashboard', baseUrl()));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
