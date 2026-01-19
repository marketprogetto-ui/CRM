'use client';

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutos (em milissegundos)

export function SessionTimeout() {
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }, [router]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(handleLogout, TIMEOUT_DURATION);
    }, [handleLogout]);

    useEffect(() => {
        // Eventos que resetam o cronômetro
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart'
        ];

        const handleActivity = () => resetTimer();

        // Inicia o cronômetro no mount
        resetTimer();

        // Adiciona listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        // Limpeza no unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer]);

    return null; // Componente invisível
}
