import { createFileRoute, Link } from "@tanstack/react-router";
import { BrainCircuit, CalendarCheck, GraduationCap, ShieldCheck, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Student Performance & Risk Analytics", "Identify at-risk students early with explainable analytics and attendance tracking."),
  component: Landing,
});

const features = [
  { icon: BrainCircuit, title: "Explainable Risk Scoring", text: "Every risk classification is accompanied by plain-language feature contribution drivers, so faculty understand exactly why a student was flagged." },
  { icon: CalendarCheck, title: "Attendance Tracking", text: "A daily batch portal records presence in seconds and feeds attendance directly into the evaluation engine." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero text-primary-foreground">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2"><GraduationCap className="h-6 w-6 text-gold" /><span className="font-serif text-xl font-semibold">ScholarRisk</span></div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/login">Login</Link></Button>
            <Button asChild className="bg-gold text-foreground hover:bg-gold/90"><Link to="/signup">Sign Up</Link></Button>
          </div>
        </nav>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Academic Intelligence Platform</p>
            <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">Student Performance &amp; Risk Analytics System</h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/80">A decision-support platform for faculty and administrators. Detect academic risk early, understand its causes, and act with targeted interventions.</p>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg" className="bg-gold text-foreground hover:bg-gold/90"><Link to="/signup">Create faculty account</Link></Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/login">Sign in</Link></Button>
            </div>
          </div>
          <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between text-sm"><span className="font-medium">Cohort Risk Summary</span><LineChart className="h-4 w-4 text-gold" /></div>
            {[["High Risk", 18, "bg-risk-high"], ["Moderate", 27, "bg-risk-moderate"], ["On Track", 55, "bg-risk-low"]].map(([l, v, c]) => (
              <div key={l as string} className="mb-4">
                <div className="mb-1 flex justify-between text-sm"><span>{l}</span><span>{v}%</span></div>
                <div className="h-2 rounded-full bg-primary-foreground/10"><div className={`h-2 rounded-full ${c}`} style={{ width: `${v}%` }} /></div>
              </div>
            ))}
            <div className="mt-6 flex items-start gap-3 rounded-md bg-primary-foreground/10 p-4 text-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />Risk driver: attendance 8.4 points below the 75% requirement contributed 62% to this classification.</div>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-center font-serif text-3xl font-semibold">Core Capabilities</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">Built for transparent, accountable academic decision-making.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-md bg-accent p-2.5"><f.icon className="h-5 w-5 text-primary" /></div>
              <h3 className="font-serif text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">© 2026 ScholarRisk · Student Performance &amp; Risk Analytics</footer>
    </div>
  );
}
