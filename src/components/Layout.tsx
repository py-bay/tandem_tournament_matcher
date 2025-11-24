import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, LayoutDashboard, Settings } from 'lucide-react';
import clsx from 'clsx';

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Settings, label: 'Setup' },
        { path: '/tournament', icon: LayoutDashboard, label: 'Matches' },
        { path: '/standings', icon: Trophy, label: 'Standings' },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xl">
                        <Users className="w-6 h-6 text-blue-500" />
                        <span>TandemMaster</span>
                    </div>

                    <nav className="flex gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors",
                                    location.pathname === item.path
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
                {children}
            </main>

            <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
                <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} Tandem Chess Tournament Manager
                </div>
            </footer>
        </div>
    );
}
