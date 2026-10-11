import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthCard } from "@/components/AuthCard";
import { Field, Notice } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/login")({
  head: () => meta("Sign in", "Faculty and administrator sign in to the risk analytics platform."),
  component: Login,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email").max(255), password: z.string().min(6, "Password must be at least 6 characters").max(128) });

function Login() {
  const navigate = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const p = schema.safeParse(f);
    if (!p.success) return setErr(p.error.issues[0].message);
    setBusy(true);
    try { await login(p.data.email, p.data.password); navigate({ to: "/dashboard" }); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  return (
    <AuthCard title="Sign in" subtitle="Access the faculty analytics workspace." footer={<>No account? <Link to="/signup" className="font-medium text-primary hover:underline">Create one</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {err && <Notice kind="err">{err}</Notice>}
        <Field label="Institutional email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@college.edu" /></Field>
        <Field label="Password"><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
    </AuthCard>
  );
}
