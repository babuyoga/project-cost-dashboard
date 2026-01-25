"use client";

import { LogOut, User, LayoutDashboard, Shield, Database } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const pathname = usePathname();

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-sky-500",
    },
    {
      label: "Admin Panel",
      icon: Shield,
      href: "/admin",
      color: "text-violet-500",
    },
    {
      label: "API Explorer",
      icon: Database,
      href: "/api-explorer",
      color: "text-pink-700",
    },
    {
      label: "Sessions",
      icon: LogOut,
      href: "/admin/session",
      color: "text-orange-500",
      newTab: false,
    },
  ];

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <aside className="relative flex flex-col h-screen flex-shrink-0 w-[280px] border-r border-slate-800 bg-slate-950 text-white transition-all duration-300">
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col p-6">
        
        <div className="w-full flex items-center justify-between mb-8">
             <h3 className="text-xl font-bold truncate flex items-center gap-2">
                <Shield className="w-8 h-8 text-blue-500" />
                Admin
             </h3>
        </div>

        <div className="flex flex-col space-y-2">
            {routes.map((route) => (
                <Link
                    key={route.href}
                    href={route.href}
                    target={route.newTab !== false ? "_blank" : undefined}
                    rel={route.newTab !== false ? "noopener noreferrer" : undefined}
                    className={`text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-slate-800 rounded-lg transition-all
                    ${pathname === route.href ? "bg-slate-800 text-white" : "text-slate-400"}
                    `}
                >
                    <div className="flex items-center flex-1">
                        <route.icon className={`h-5 w-5 mr-3 ${route.color}`} />
                        {route.label}
                    </div>
                </Link>
            ))}
        </div>
      </div>

      {/* Footer with User Info */}
      <div className="border-t border-slate-800 bg-slate-950 flex-shrink-0 z-50 p-6">
          <div className="flex items-center justify-between">
            <Link href="/settings" className="flex items-center gap-3 hover:bg-slate-800/50 p-2 rounded transition-colors -ml-2">
              <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-600/30 text-blue-400">
                <User size={16} />
              </div>
              <span className="text-sm font-medium text-slate-200">Username</span>
            </Link>
            <button 
              onClick={handleSignOut} 
              className="group relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <LogOut size={18} />
              
              {/* Custom Tooltip */}
              <span className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700 shadow-xl">
                Sign Out
              </span>
            </button>
          </div>
      </div>
    </aside>
  );
}
