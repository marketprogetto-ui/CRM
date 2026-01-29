'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const INACTIVITY_LIMIT_MS = 90 * 1000; // 90 seconds

export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Function to logout
    const handleLogout = async () => {
        console.log('Auto-logout due to inactivity');
        await supabase.auth.signOut();
        router.push('/login');
    };

    // Reset timer
    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT_MS);
    };

    useEffect(() => {
        // Events to listen
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

        // Add listeners
        const onEvent = () => resetTimer();

        events.forEach(event => {
            window.addEventListener(event, onEvent);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, onEvent);
            });
        };
    }, []);

    return <>{children}</>;
}
