'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    BarChart3,
    Calendar,
    Layers,
    Truck,
    Users,
    Settings,
    LogOut,
    ChevronRight,
    Search,
    Database,
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from '@/components/ui/sidebar';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

const items = [
    {
        title: 'Pipeline Comercial',
        url: '/pipeline/commercial',
        icon: Layers,
    },

    {
        title: 'Atividades',
        url: '/activities',
        icon: Calendar,
    },
    {
        title: 'Relatórios',
        url: '/reports',
        icon: BarChart3,
    },
    {
        title: 'Minha Conta',
        url: '/profile',
        icon: Settings,
    },
];

const adminItems = [
    {
        title: 'Usuários',
        url: '/admin/users',
        icon: Users,
    },
    {
        title: 'Logs de Auditoria',
        url: '/admin/logs',
        icon: Database,
    },
];

export function AppSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setRole(profile?.role || 'user');
            }
        };
        fetchRole();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <Sidebar className="border-r border-slate-800 bg-[#0f172a] text-slate-300">
            <SidebarHeader className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Layers className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight">Progetto</span>
                </div>
            </SidebarHeader>
            <SidebarContent className="px-2 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-slate-500 px-4 mb-2 text-xs uppercase tracking-widest font-semibold">Menu Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${pathname === item.url
                                            ? 'bg-indigo-600/10 text-indigo-400 font-medium'
                                            : 'hover:bg-slate-800/50 hover:text-slate-100'
                                            }`}
                                    >
                                        <a href={item.url}>
                                            <item.icon className={`w-5 h-5 ${pathname === item.url ? 'text-indigo-400' : 'text-slate-400'}`} />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {role === 'admin' && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-slate-500 px-4 mb-2 text-xs uppercase tracking-widest font-semibold mt-4">Administração</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {adminItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.url}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${pathname === item.url
                                                ? 'bg-indigo-600/10 text-indigo-400 font-medium'
                                                : 'hover:bg-slate-800/50 hover:text-slate-100'
                                                }`}
                                        >
                                            <a href={item.url}>
                                                <item.icon className={`w-5 h-5 ${pathname === item.url ? 'text-indigo-400' : 'text-slate-400'}`} />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-slate-800 bg-slate-900/20">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sair do Sistema</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
