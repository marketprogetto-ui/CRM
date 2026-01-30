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
        data: { user },
    } = await supabase.auth.getUser();

    // --- ENFORCED INACTIVITY CHECK ---
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    const lastActivity = request.cookies.get('last_activity')?.value;
    const now = Date.now();

    if (user) {
        let shouldForceLogout = false;

        if (!lastActivity) {
            // Se o usuário está logado mas NÃO tem registro de atividade recente
            // consideramos sessão expirada (provavelmente de um dia anterior)
            console.log('Middleware: Sessão ativa sem registro de atividade. Forçando logout.');
            shouldForceLogout = true;
        } else {
            const lastActiveTime = parseInt(lastActivity, 10);
            if (now - lastActiveTime > INACTIVITY_LIMIT) {
                console.log('Middleware: Sessão expirada por inatividade.');
                shouldForceLogout = true;
            }
        }

        if (shouldForceLogout) {
            await supabase.auth.signOut();
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/login';
            const res = NextResponse.redirect(redirectUrl);
            res.cookies.delete('last_activity');
            // Limpa cookies do Supabase explicitamente (fallback)
            res.cookies.getAll().forEach(cookie => {
                if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
                    res.cookies.delete(cookie.name);
                }
            });
            return res;
        }

        // Sessão válida, renova o heartbeat
        response.cookies.set('last_activity', now.toString(), {
            path: '/',
            maxAge: 3600, // 1 hora
            httpOnly: false,
            sameSite: 'lax',
        });
    }

    // --- REDIRECIONAMENTO DE AUTH ---
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');

    if (!user && !isLoginPage) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        return NextResponse.redirect(redirectUrl);
    }

    if (user && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return response;

    return response;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
