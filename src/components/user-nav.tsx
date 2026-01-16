'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export function UserNav() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });
    }, []);

    const initials = user?.email?.substring(0, 2).toUpperCase() || 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-slate-800 p-0 hover:bg-slate-800 transition-colors">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="/avatars/01.png" alt="@user" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold">{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-slate-200" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-white">{user?.email}</p>
                        <p className="text-xs leading-none text-slate-400">Administrador</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuGroup>
                    <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                        Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                        Configurações
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                    className="hover:bg-red-900/20 focus:bg-red-900/20 text-red-400 cursor-pointer"
                    onClick={() => supabase.auth.signOut()}
                >
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
