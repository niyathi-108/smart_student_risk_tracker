import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Field, NativeSelect, Notice, PageHeader } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, useDB } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/marks/new")({
  validateSearch: (s: Record<string, unknown>) => ({ student: typeof s.student === "string" ? s.student : undefined }),
  head: () => meta("Add Marks", "Record an IAT or End Semester assessment score."),
  component: () => <AppShell><AddMarks /></AppShell>,
});

export const markSchema = z.object({
  student_id: z.string().trim().min(1, "Select a student"),
  course_code: z.string().trim().regex(/^[A-Za-z]{2,4}\d{2,4}$/, "Course code like CS301"),
  title: z.string().trim().min(2, "Course title is required").max(100),
  assessment_type: z.enum(["IAT1", "IAT2", "EndSem"]),
  score: z.coerce.number().min(0),
  max_score: z.coerce.number().positive().max(200),
}).refine((d) => d.score <= d.max_score, { message: "Score cannot exceed max score" });

function AddMarks() {
  const db = useDB();
  const navigate = useNavigate();
  const { student } = Route.useSearch();
  const [f, setF] = useState({ student_id: student ?? "", course_code: "", title: "", assessment_type: "IAT1", score: "", max_score: "50" });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const p = markSchema.safeParse(f);
    if (!p.success) return setErr(p.error.issues[0].message);
    actions.addAssessments([{ ...p.data, course_code: p.data.course_code.toUpperCase() }]);
    navigate({ to: "/students/$id", params: { id: p.data.student_id } });
  }
  return (
    <>
      <PageHeader title="Add Marks" subtitle="Record a single assessment score. IAT-1, IAT-2 and End Sem are aggregated per subject." />
      <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-lg border bg-card p-6 shadow-sm">
        {err && <Notice kind="err">{err}</Notice>}
        <Field label="Student"><NativeSelect className="w-full" value={f.student_id} onChange={set("student_id")}><option value="">Select student…</option>{db.students.map((s) => <option key={s.student_id} value={s.student_id}>{s.student_id} — {s.first_name} {s.last_name}</option>)}</NativeSelect></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Course code"><Input value={f.course_code} onChange={set("course_code")} placeholder="CS301" /></Field>
          <Field label="Course title"><Input value={f.title} onChange={set("title")} placeholder="Data Structures" /></Field>
          <Field label="Assessment type"><NativeSelect className="w-full" value={f.assessment_type} onChange={(e) => setF({ ...f, assessment_type: e.target.value, max_score: e.target.value === "EndSem" ? "100" : "50" })}><option value="IAT1">IAT-1</option><option value="IAT2">IAT-2</option><option value="EndSem">End Semester</option></NativeSelect></Field>
          <div className="grid grid-cols-2 gap-2"><Field label="Score"><Input type="number" value={f.score} onChange={set("score")} /></Field><Field label="Max score"><Input type="number" value={f.max_score} onChange={set("max_score")} /></Field></div>
        </div>
        <div className="flex justify-end"><Button type="submit">Save marks</Button></div>
      </form>
    </>
  );
}
