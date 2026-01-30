'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Logout Function
    const handleLogout = async () => {
        console.log('Auto-logout due to inactivity');
        try {
            await supabase.auth.signOut();
            localStorage.removeItem('last_activity');
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Reset Timer & Update Storage
    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Update local storage to persist activity across reloads/closes
        localStorage.setItem('last_activity', Date.now().toString());

        // Set new timeout
        timerRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT_MS);
    };

    const checkInactivityOnMount = () => {
        const lastActivity = localStorage.getItem('last_activity');
        if (lastActivity) {
            const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
            if (timeSinceLastActivity > INACTIVITY_LIMIT_MS) {
                // Too much time passed since last action (even if browser was closed)
                handleLogout();
                return false; // indicating immediate logout
            }
        }
        return true; // safe to continue
    };

    useEffect(() => {
        // Initial check on mount
        const isSafe = checkInactivityOnMount();
        if (!isSafe) return;

        // Events to listen
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

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
