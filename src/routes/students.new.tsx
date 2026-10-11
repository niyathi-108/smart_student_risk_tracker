import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Field, NativeSelect, Notice, PageHeader } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/students/new")({
  head: () => meta("Add Student", "Register a single student record."),
  component: () => <AppShell><AddStudent /></AppShell>,
});

export const studentSchema = z.object({
  student_id: z.string().trim().regex(/^[A-Za-z0-9-]{2,20}$/, "Student ID: 2–20 letters, digits or hyphens"),
  first_name: z.string().trim().min(1, "First name is required").max(50),
  last_name: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Enter a valid email").max(255),
  department: z.string().trim().min(2, "Department is required").max(80),
  semester: z.coerce.number().int().min(1).max(8),
});

function AddStudent() {
  const navigate = useNavigate();
  const [f, setF] = useState({ student_id: "", first_name: "", last_name: "", email: "", department: "Computer Science", semester: "1" });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const p = studentSchema.safeParse(f);
    if (!p.success) return setErr(p.error.issues[0].message);
    try { actions.addStudent(p.data); navigate({ to: "/students/$id", params: { id: p.data.student_id } }); } catch (x) { setErr((x as Error).message); }
  }
  return (
    <>
      <PageHeader title="Add Student" subtitle="Create a new student record. Risk is evaluated automatically as data is added." />
      <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-lg border bg-card p-6 shadow-sm">
        {err && <Notice kind="err">{err}</Notice>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Student ID"><Input value={f.student_id} onChange={set("student_id")} placeholder="STU007" /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={set("email")} /></Field>
          <Field label="First name"><Input value={f.first_name} onChange={set("first_name")} /></Field>
          <Field label="Last name"><Input value={f.last_name} onChange={set("last_name")} /></Field>
          <Field label="Department"><NativeSelect className="w-full" value={f.department} onChange={set("department")}>{["Computer Science", "Electronics", "Mechanical", "Civil", "Mathematics"].map((d) => <option key={d}>{d}</option>)}</NativeSelect></Field>
          <Field label="Semester"><NativeSelect className="w-full" value={f.semester} onChange={set("semester")}>{Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>Semester {i + 1}</option>)}</NativeSelect></Field>
        </div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button><Button type="submit">Save student</Button></div>
      </form>
    </>
  );
}
