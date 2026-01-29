
export const dynamic = 'force-dynamic';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { UserNav } from '@/components/user-nav';

import { AutoLogoutProvider } from '@/components/auto-logout-provider';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AutoLogoutProvider>
            <SidebarProvider>
                <div className="flex min-h-screen bg-[#020617] text-slate-100 w-full">
                    <AppSidebar />
                    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-2 md:gap-4">
                                <SidebarTrigger className="text-slate-400 hover:text-white transition-colors" />
                                <Separator orientation="vertical" className="h-6 bg-slate-800 hidden md:block" />
                                <h1 className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
                                    Dashboard
                                </h1>
                            </div>
                            <UserNav />
                        </header>
                        <div className="flex-1 overflow-auto p-4 md:p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
                            {children}
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        </AutoLogoutProvider>
    );
}
