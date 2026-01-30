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

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    // --- ENFORCED INACTIVITY CHECK ---
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    const lastActivity = request.cookies.get('last_activity')?.value;
    const now = Date.now();

    if (session && user) {
        let shouldForceLogout = false;

        // Check if we have a fresh login flag (set by Login Page)
        const isFreshLogin = request.cookies.get('fresh_login')?.value === 'true';

        if (!lastActivity) {
            // No activity cookie: could be ghost session or fresh login
            if (!isFreshLogin) {
                console.log('Middleware: Session active without activity or fresh login flag. Forcing logout.');
                shouldForceLogout = true;
            } else {
                console.log('Middleware: Fresh login detected. Allowing access.');
            }
        } else {
            const lastActiveTime = parseInt(lastActivity, 10);
            if (now - lastActiveTime > INACTIVITY_LIMIT) {
                console.log('Middleware: Session expired due to inactivity.');
                shouldForceLogout = true;
            }
        }

        if (shouldForceLogout) {
            await supabase.auth.signOut();
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/login';
            const res = NextResponse.redirect(redirectUrl);
            res.cookies.delete('last_activity');
            // Clear supabase cookies explicitly
            res.cookies.getAll().forEach(cookie => {
                if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
                    res.cookies.delete(cookie.name);
                }
            });
            return res;
        }

        // Valid Session: Update Heartbeat
        response.cookies.set('last_activity', now.toString(), {
            path: '/',
            maxAge: 3600, // 1 hour survival (client refreshes it)
            httpOnly: false,
            sameSite: 'lax',
        });

        // Clear fresh_login cookie if it exists to allow normal inactivity checks
        if (isFreshLogin) {
            response.cookies.delete('fresh_login');
        }
    }

    // --- AUTH REDIRECTION ---
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');

    if (!user && !isLoginPage) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        // Clear cookies on logout
        response.cookies.delete('last_activity');
        return NextResponse.redirect(redirectUrl);
    }

    if (user && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};