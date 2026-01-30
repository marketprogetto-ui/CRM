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

        // Calcular idade da sessão (se disponível)
        // O Supabase session não traz o "created_at" da sessão de forma óbvia no SSR,
        // mas podemos checar se o cookie de atividade existe.

        if (!lastActivity) {
            // Se NÃO tem cookie de atividade, mas o usuário está logado:
            // Pode ser um login acabado de fazer (fresh) ou uma sessão antiga (zumbi).
            // Para evitar o loop de login, permitimos se o usuário estiver vindo de /login
            const referer = request.headers.get('referer') || '';
            const isFreshLogin = referer.includes('/login');

            if (!isFreshLogin) {
                // Sessão zumbi de outro dia/janela fechada há muito tempo
                console.log('Middleware: Sessão ativa sem atividade recente e não é fresh login. Forçando logout.');
                shouldForceLogout = true;
            }
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
            return res;
        }

        // Sessão válida: Atualiza o heartbeat (cookie) no objeto de resposta
        response.cookies.set('last_activity', now.toString(), {
            path: '/',
            maxAge: 3600,
            httpOnly: false,
            sameSite: 'lax',
        });
    }

    // --- REDIRECIONAMENTO DE AUTH ---
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');

    if (!user && !isLoginPage) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        // Limpar cookies de atividade ao deslogar
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
