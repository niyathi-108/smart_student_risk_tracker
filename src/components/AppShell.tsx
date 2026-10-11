import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, CalendarCheck, FilePlus2, GraduationCap, LayoutDashboard, LogOut, Upload, UserPlus, FileSpreadsheet } from "lucide-react";
import { getUser, logout } from "@/lib/auth";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/attendance", label: "Daily Attendance", icon: CalendarCheck },
  { to: "/students/new", label: "Add Student", icon: UserPlus },
  { to: "/students/bulk", label: "Bulk Upload Students", icon: Upload },
  { to: "/marks/new", label: "Add Marks", icon: FilePlus2 },
  { to: "/marks/bulk", label: "Bulk Upload Marks", icon: FileSpreadsheet },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const u = getUser();
    if (!u) navigate({ to: "/login" });
    else { setUser(u); setReady(true); }
  }, [navigate]);
  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2 border-b border-sidebar-border px-6 py-5">
          <GraduationCap className="h-6 w-6 text-sidebar-primary" />
          <span className="font-serif text-lg font-semibold">ScholarRisk</span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-sm">
          <div className="font-medium">{user?.name}</div>
          <div className="text-xs text-sidebar-foreground/60">{user?.role} · {user?.email}</div>
          <button onClick={() => { logout(); navigate({ to: "/login" }); }} className="mt-3 flex items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-primary">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-6 py-3 lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2 font-serif font-semibold"><BarChart3 className="h-5 w-5 text-primary" />ScholarRisk</Link>
          <button onClick={() => { logout(); navigate({ to: "/login" }); }} className="text-sm text-muted-foreground">Sign out</button>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
