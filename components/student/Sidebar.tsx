"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Sparkles,
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  BarChart2,
  ClipboardList,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/join", label: "Join Quiz", icon: PlusCircle },
  { href: "/student/quizzes", label: "My Quizzes", icon: BookOpen },
  { href: "/student/results", label: "Results", icon: ClipboardList },
  { href: "/student/performance", label: "Performance", icon: BarChart2 },
  { href: "/student/profile", label: "Profile", icon: User },
];

interface Props {
  user: { name: string; email: string };
}

export default function StudentSidebar({ user }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-slate-200 bg-white transition-all duration-200 h-screen sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-2 px-4 py-5 border-b border-slate-100", collapsed && "justify-center px-2")}>
        <Sparkles className="h-5 w-5 text-violet-600 shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold text-violet-700 truncate">Quizora</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/student/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-slate-100 p-3 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 w-full transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
