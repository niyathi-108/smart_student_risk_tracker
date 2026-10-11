import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthCard } from "@/components/AuthCard";
import { Field, NativeSelect, Notice } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup } from "@/lib/auth";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/signup")({
  head: () => meta("Create account", "Register a faculty or administrator account."),
  component: Signup,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  role: z.enum(["Faculty", "Administrator"]),
});

function Signup() {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", role: "Faculty" });
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const p = schema.safeParse(f);
    if (!p.success) return setErr(p.error.issues[0].message);
    try { await signup(p.data); navigate({ to: "/dashboard" }); } catch (x) { setErr((x as Error).message); }
  }
  return (
    <AuthCard title="Create account" subtitle="Register for faculty or administrator access." footer={<>Already registered? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {err && <Notice kind="err">{err}</Notice>}
        <Field label="Full name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Institutional email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Field label="Role"><NativeSelect className="w-full" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option>Faculty</option><option>Administrator</option></NativeSelect></Field>
        <Button type="submit" className="w-full">Create account</Button>
      </form>
    </AuthCard>
  );
}
