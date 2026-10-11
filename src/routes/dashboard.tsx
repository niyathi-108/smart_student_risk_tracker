import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck, CheckCircle2, Eye, Search, Trash2, Upload, UserPlus, Users, Activity } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { AppShell } from "@/components/AppShell";
import { NativeSelect, PageHeader, RiskBadge } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, useDB } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/dashboard")({
  head: () => meta("Dashboard", "Cohort risk overview and student intervention alerts."),
  component: () => <AppShell><Dashboard /></AppShell>,
});

function Dashboard() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("");
  const rows = useMemo(() => db.interventions.map((i) => ({ ...i, s: db.students.find((s) => s.student_id === i.student_id)! })).filter((r) => r.s), [db]);
  const count = (l: string) => rows.filter((r) => r.risk_level === l).length;
  const filtered = rows.filter((r) => (!risk || r.risk_level === risk) && `${r.s.student_id} ${r.s.first_name} ${r.s.last_name} ${r.s.department}`.toLowerCase().includes(q.toLowerCase()));
  const kpis = [
    { label: "Total Students", value: db.students.length, icon: Users, tone: "text-primary bg-accent" },
    { label: "High Risk", value: count("High"), icon: AlertTriangle, tone: "text-risk-high bg-risk-high-soft" },
    { label: "Moderate Risk", value: count("Moderate"), icon: Activity, tone: "text-risk-moderate bg-risk-moderate-soft" },
    { label: "On Track", value: count("Low"), icon: CheckCircle2, tone: "text-risk-low bg-risk-low-soft" },
  ];
  const chart = [
    { name: "High", v: count("High"), c: "var(--risk-high)" },
    { name: "Moderate", v: count("Moderate"), c: "var(--risk-moderate)" },
    { name: "On Track", v: count("Low"), c: "var(--risk-low)" },
  ];

  return (
    <>
      <PageHeader title="Risk Analytics Dashboard" subtitle="Overview of the current cohort and pending interventions."
        actions={<>
          <Button asChild variant="outline"><Link to="/attendance"><CalendarCheck className="h-4 w-4" />Daily Attendance Portal</Link></Button>
          <Button asChild variant="outline"><Link to="/students/bulk"><Upload className="h-4 w-4" />Bulk Upload Students</Link></Button>
          <Button asChild><Link to="/students/new"><UserPlus className="h-4 w-4" />Add Student</Link></Button>
        </>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k.label}</span><span className={`rounded-md p-2 ${k.tone}`}><k.icon className="h-4 w-4" /></span></div>
            <div className="mt-3 font-serif text-3xl font-semibold">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
            <h2 className="font-serif text-lg font-semibold">Recent Student Intervention Alerts</h2>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-56 pl-8" placeholder="Search students…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <NativeSelect value={risk} onChange={(e) => setRisk(e.target.value)}><option value="">All risk levels</option><option value="High">High</option><option value="Moderate">Moderate</option><option value="Low">Low</option></NativeSelect>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>{["Student ID", "Name", "Risk Level", "Identified Reason", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/50">
                    <td className="px-4 py-3 font-mono text-xs">{r.s.student_id}</td>
                    <td className="px-4 py-3 font-medium">{r.s.first_name} {r.s.last_name}<div className="text-xs font-normal text-muted-foreground">{r.s.department}</div></td>
                    <td className="px-4 py-3"><RiskBadge level={r.risk_level} /></td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">{r.reason}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => actions.toggleIntervention(r.student_id)} className={`rounded-full border px-3 py-1 text-xs font-medium ${r.status === "Pending" ? "border-risk-moderate/40 bg-risk-moderate-soft text-risk-moderate" : "border-risk-low/40 bg-risk-low-soft text-risk-low"}`}>{r.status}</button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button asChild size="icon" variant="ghost" aria-label="View"><Link to="/students/$id" params={{ id: r.student_id }}><Eye className="h-4 w-4" /></Link></Button>
                        <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirm(`Delete ${r.s.first_name} ${r.s.last_name}?`) && actions.deleteStudent(r.student_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No students match the current filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-semibold">Risk Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip />
                <Bar dataKey="v" name="Students" radius={[4, 4, 0, 0]}>{chart.map((c) => <Cell key={c.name} fill={c.c} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button onClick={() => confirm("Reset demo data?") && actions.reset()} className="mt-4 text-xs text-muted-foreground hover:underline">Reset demo data</button>
        </div>
      </div>
    </>
  );
}
