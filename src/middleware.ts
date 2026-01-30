import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    // For automated tests navigability validation
    if (process.env.SKIP_AUTH === 'true') {
        return response;
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // --- INACTIVITY CHECK (Custom Server-Side logic) ---
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    const lastActivity = request.cookies.get('last_activity')?.value;
    const now = Date.now();

    if (user && lastActivity) {
        const lastActiveTime = parseInt(lastActivity, 10);
        if (now - lastActiveTime > INACTIVITY_LIMIT) {
            // Force logout: Clear session cookies and redirect
            console.log('Middleware: Force logout due to inactivity');
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/login';
            const res = NextResponse.redirect(redirectUrl);

            // Clear Supabase session cookies (best effort)
            // usually supabase-auth-token or similar depending on version
            // But we can just use the supabase client to signOut and let it handle the response
            await supabase.auth.signOut();
            res.cookies.delete('last_activity');
            return res;
        }
    }

    // Update last_activity on every valid request to the dashboard/app
    // This keeps the session alive while the user is actively clicking
    if (user) {
        response.cookies.set('last_activity', now.toString(), {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days survival but logic checks for 30m
            httpOnly: false, // Accessible by client heartbeat too
            sameSite: 'lax',
        });
    }
    // ---------------------------------------------------

    // If there is no user and the user is not on the login page, redirect to login
    if (!user && !request.nextUrl.pathname.startsWith('/login')) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // If there is a session and the user is on the login page, redirect to home
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
