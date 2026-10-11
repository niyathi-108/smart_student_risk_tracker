import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, FilePlus2, Mail, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import AiMentorReport from "@/components/AiMentorReport";
import { RiskBadge } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { actions, useDB } from "@/lib/store";
import {
  attendancePercent,
  attendanceRisk,
  averageMark,
  contributionDrivers,
  markRisk,
  overallRisk,
  subjectPerformance,
  type RiskLevel,
} from "@/lib/evaluation";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/students/$id")({
  head: ({ params }) =>
    meta(
      `Student ${params.id}`,
      "Student profile, risk explanation, subject performance and mentorship plan.",
    ),
  component: () => (
    <AppShell>
      <Detail />
    </AppShell>
  ),
});

const bandCls = {
  red: "bg-risk-high",
  yellow: "bg-risk-moderate",
  green: "bg-risk-low",
};

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border bg-card shadow-sm ${className}`}>
      <h2 className="border-b px-5 py-3 font-serif text-lg font-semibold">{title}</h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Detail() {
  const { id } = Route.useParams();
  const db = useDB();
  const s = db.students.find((x) => x.student_id === id);

  if (!s) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Student {id} not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const marks = db.assessments.filter((a) => a.student_id === id);
  const att = db.attendance
    .filter((a) => a.student_id === id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const avg = averageMark(marks);
  const attPct = attendancePercent(att);
  const mr = markRisk(avg);
  const ar = attendanceRisk(attPct);
  const risk = overallRisk(mr, ar);
  const subjects = subjectPerformance(marks);
  const drivers = contributionDrivers(avg, attPct, subjects);

  const latestAttendance = att.at(-1);
  const end = latestAttendance ? new Date(latestAttendance.date) : new Date();
  const days = Array.from({ length: 28 }, (_, index) => {
    const d = new Date(end);
    d.setDate(end.getDate() - 27 + index);
    return d.toISOString().slice(0, 10);
  });
  const firstCalendarDay = days[0] ?? new Date().toISOString().slice(0, 10);
  const byDate = new Map(att.map((a) => [a.date, a.status]));

  const statCards: Array<[string, number, RiskLevel]> = [
    ["Average Mark", avg, mr],
    ["Attendance", attPct, ar],
  ];

  return (
    <>
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mb-6 flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-serif text-xl text-primary-foreground">
            {s.first_name[0]}
            {s.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-semibold">
                {s.first_name} {s.last_name}
              </h1>
              <RiskBadge level={risk} />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{s.student_id}</span>
              {" · "}
              {s.department}
              {" · "}
              Semester {s.semester}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {s.email}
            </p>
          </div>
        </div>

        <Button asChild variant="outline">
          <Link to="/marks/new" search={{ student: s.student_id }}>
            <FilePlus2 className="h-4 w-4" />
            Add Marks
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {statCards.map(([label, value, riskLevel]) => (
          <div key={label} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label} %
              </span>
              <RiskBadge level={riskLevel} />
            </div>
            <div className="mt-2 font-serif text-4xl font-semibold">{value}%</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="System Evaluation Log · Risk Explanation">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Rule #03 — Feature contribution drivers
          </p>
          <div className="space-y-4">
            {drivers.map((d) => (
              <div key={d.feature}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{d.feature}</span>
                  <span className="font-mono">{d.contribution}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${d.contribution}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{d.explanation}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md bg-secondary p-3 text-sm">
            Mark risk: <strong>{mr}</strong> · Attendance risk: <strong>{ar}</strong> → Overall
            classification: <strong>{risk === "Low" ? "On Track" : risk}</strong>
          </div>
        </Card>

        <Card title="Overall Subject Performance">
          <div className="space-y-4">
            {subjects.map((sp) => (
              <div key={sp.course_code}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {sp.course_code}
                    </span>{" "}
                    {sp.title}
                  </span>
                  <span className="font-semibold">{sp.percent}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary">
                  <div
                    className={`h-2.5 rounded-full ${bandCls[sp.band]}`}
                    style={{ width: `${sp.percent}%` }}
                  />
                </div>
              </div>
            ))}
            {!subjects.length && (
              <p className="text-sm text-muted-foreground">No assessments recorded.</p>
            )}
          </div>
          <div className="mt-5 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-risk-high" />
              &lt;50%
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-risk-moderate" />
              50–60%
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-risk-low" />
              ≥60%
            </span>
          </div>
        </Card>

        <Card title="Daily Attendance Calendar">
          <div className="grid grid-cols-7 gap-1.5">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="text-center text-xs font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: new Date(firstCalendarDay).getDay() }).map((_, index) => (
              <div key={`padding-${index}`} />
            ))}
            {days.map((day) => {
              const st = byDate.get(day);
              const cls =
                st === "Present"
                  ? "bg-risk-low-soft text-risk-low border-risk-low/30"
                  : st === "Absent"
                    ? "bg-risk-high-soft text-risk-high border-risk-high/30"
                    : "bg-secondary text-muted-foreground";

              return (
                <div
                  key={day}
                  title={`${day}: ${st ?? "Pending"}`}
                  className={`flex aspect-square items-center justify-center rounded border text-xs font-medium ${cls}`}
                >
                  {Number(day.slice(8))}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span>
              ■ <span className="text-risk-low">Present</span>
            </span>
            <span>
              ■ <span className="text-risk-high">Absent</span>
            </span>
            <span>■ Pending</span>
          </div>
        </Card>

        <Card title="Marks">
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Course</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y">
                {marks.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2">
                      <span className="font-mono text-xs">{m.course_code}</span> {m.title}
                    </td>
                    <td>{m.assessment_type}</td>
                    <td className="font-medium">
                      {m.score}/{m.max_score}
                    </td>
                    <td className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete mark"
                        onClick={() => actions.deleteAssessment(m.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <AiMentorReport student={s} assessments={marks} />
    </>
  );
}
