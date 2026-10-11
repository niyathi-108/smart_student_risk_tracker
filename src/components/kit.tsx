import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/evaluation";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const cls = {
    High: "bg-risk-high-soft text-risk-high border-risk-high/30",
    Moderate: "bg-risk-moderate-soft text-risk-moderate border-risk-moderate/30",
    Low: "bg-risk-low-soft text-risk-low border-risk-low/30",
  }[level];
  return <span className={cn("inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", cls)}>{level === "Low" ? "On Track" : level}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function NativeSelect({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cn("h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring", className)} />;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Notice({ kind, children }: { kind: "ok" | "err"; children: ReactNode }) {
  return <div className={cn("rounded-md border px-4 py-3 text-sm", kind === "ok" ? "border-risk-low/30 bg-risk-low-soft text-risk-low" : "border-risk-high/30 bg-risk-high-soft text-risk-high")}>{children}</div>;
}
