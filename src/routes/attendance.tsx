import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Field, Notice, PageHeader } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, useDB } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/attendance")({
  head: () => meta("Daily Attendance Portal", "Record daily attendance for all students in one batch."),
  component: () => <AppShell><Portal /></AppShell>,
});

function Portal() {
  const db = useDB();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, "Present" | "Absent">>({});
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const m: Record<string, "Present" | "Absent"> = {};
    db.students.forEach((s) => { m[s.student_id] = db.attendance.find((a) => a.student_id === s.student_id && a.date === date)?.status ?? "Present"; });
    setMarks(m);
  }, [date, db.students.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = (st: "Present" | "Absent") => setMarks(Object.fromEntries(db.students.map((s) => [s.student_id, st])));
  const present = Object.values(marks).filter((v) => v === "Present").length;

  return (
    <>
      <PageHeader title="Daily Attendance Portal" subtitle="Mark attendance for the selected date, then submit in one batch." />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-48"><Field label="Date"><Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setMsg(""); }} /></Field></div>
        <Button variant="outline" onClick={() => all("Present")}>Mark all present</Button>
        <Button variant="outline" onClick={() => all("Absent")}>Mark all absent</Button>
        <span className="ml-auto text-sm text-muted-foreground">{present} present · {db.students.length - present} absent</span>
      </div>
      {msg && <div className="mb-4"><Notice kind="ok">{msg}</Notice></div>}
      <div className="rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Student ID</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Department</th><th className="px-4 py-3 text-right">Status</th></tr></thead>
          <tbody className="divide-y">
            {db.students.map((s) => {
              const st = marks[s.student_id];
              return (
                <tr key={s.student_id}>
                  <td className="px-4 py-3 font-mono text-xs">{s.student_id}</td><td className="px-4 py-3 font-medium">{s.first_name} {s.last_name}</td><td className="px-4 py-3 text-muted-foreground">{s.department}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <button onClick={() => setMarks({ ...marks, [s.student_id]: "Present" })} className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium ${st === "Present" ? "border-risk-low bg-risk-low text-primary-foreground" : "text-muted-foreground"}`}><Check className="h-3.5 w-3.5" />Present</button>
                    <button onClick={() => setMarks({ ...marks, [s.student_id]: "Absent" })} className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium ${st === "Absent" ? "border-risk-high bg-risk-high text-primary-foreground" : "text-muted-foreground"}`}><X className="h-3.5 w-3.5" />Absent</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex justify-end border-t p-4"><Button onClick={() => { actions.bulkAttendance(date, Object.entries(marks).map(([student_id, status]) => ({ student_id, status }))); setMsg(`Attendance for ${date} saved for ${db.students.length} students. Risk levels re-evaluated.`); }}>Submit attendance</Button></div>
      </div>
    </>
  );
}
