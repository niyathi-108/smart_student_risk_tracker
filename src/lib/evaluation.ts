// Mirrors backend/app/evaluation.py — keep both in sync.
export type RiskLevel = "High" | "Moderate" | "Low";
export type AssessmentType = "IAT1" | "IAT2" | "EndSem";

export interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  semester: number;
}
export interface Attendance { id: number; student_id: string; date: string; status: "Present" | "Absent" }
export interface Assessment {
  id: number; student_id: string; course_code: string; title: string;
  assessment_type: AssessmentType; score: number; max_score: number;
}
export interface Intervention {
  id: number; student_id: string; risk_level: RiskLevel; reason: string; status: "Pending" | "Resolved";
}

export const THRESHOLDS = {
  markHigh: 50, markModerate: 60, attHigh: 65, attModerate: 75, strong: 70, weak: 60,
};

export interface SubjectPerf { course_code: string; title: string; percent: number; band: "red" | "yellow" | "green" }

export function subjectBand(p: number): SubjectPerf["band"] {
  if (p < 50) return "red";
  if (p < 60) return "yellow";
  return "green";
}

export function subjectPerformance(marks: Assessment[]): SubjectPerf[] {
  const map = new Map<string, { title: string; s: number; m: number }>();
  for (const a of marks) {
    const e = map.get(a.course_code) ?? { title: a.title, s: 0, m: 0 };
    e.s += a.score; e.m += a.max_score; map.set(a.course_code, e);
  }
  return [...map.entries()].map(([code, e]) => {
    const percent = e.m ? Math.round((e.s / e.m) * 1000) / 10 : 0;
    return { course_code: code, title: e.title, percent, band: subjectBand(percent) };
  });
}

export function averageMark(marks: Assessment[]): number {
  const s = subjectPerformance(marks);
  if (!s.length) return 0;
  return Math.round((s.reduce((a, b) => a + b.percent, 0) / s.length) * 10) / 10;
}

export function attendancePercent(att: Attendance[]): number {
  if (!att.length) return 100;
  return Math.round((att.filter((a) => a.status === "Present").length / att.length) * 1000) / 10;
}

export function markRisk(avg: number): RiskLevel {
  return avg < THRESHOLDS.markHigh ? "High" : avg < THRESHOLDS.markModerate ? "Moderate" : "Low";
}
export function attendanceRisk(pct: number): RiskLevel {
  return pct < THRESHOLDS.attHigh ? "High" : pct < THRESHOLDS.attModerate ? "Moderate" : "Low";
}
const rank: Record<RiskLevel, number> = { Low: 0, Moderate: 1, High: 2 };
export function overallRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return rank[a] >= rank[b] ? a : b;
}

export interface Driver { feature: string; contribution: number; explanation: string }

/** Rule #03 — plain-language feature contribution drivers (weights sum to 100). */
export function contributionDrivers(avg: number, att: number, subjects: SubjectPerf[]): Driver[] {
  const markGap = Math.max(0, THRESHOLDS.markModerate - avg);
  const attGap = Math.max(0, THRESHOLDS.attModerate - att);
  const failing = subjects.filter((s) => s.percent < 50).length;
  const raw = [
    { feature: "Academic marks", w: markGap * 1.2, explanation: `Average mark of ${avg}% is ${markGap ? `${markGap.toFixed(1)} points below` : "at or above"} the ${THRESHOLDS.markModerate}% benchmark.` },
    { feature: "Attendance", w: attGap, explanation: `Attendance of ${att}% is ${attGap ? `${attGap.toFixed(1)} points below` : "at or above"} the ${THRESHOLDS.attModerate}% requirement.` },
    { feature: "Failing subjects", w: failing * 8, explanation: failing ? `${failing} subject(s) are below the 50% pass line.` : "No subjects below the pass line." },
  ];
  const total = raw.reduce((a, b) => a + b.w, 0);
  return raw.map((r) => ({
    feature: r.feature,
    contribution: total ? Math.round((r.w / total) * 100) : 0,
    explanation: r.explanation,
  }));
}

export function riskReason(avg: number, att: number): string {
  const parts: string[] = [];
  if (avg < THRESHOLDS.markModerate) parts.push(`Low average marks (${avg}%)`);
  if (att < THRESHOLDS.attModerate) parts.push(`Low attendance (${att}%)`);
  return parts.join("; ") || "Performing on track";
}

const IDEAS: Record<string, string[]> = {
  default: ["Build a portfolio project that applies this subject to a real community problem.", "Mentor junior students — teaching consolidates mastery."],
  CS: ["Launch an EdTech micro-SaaS tool for peer learning.", "Contribute to open-source analytics libraries."],
  MA: ["Quantitative analyst track: apply statistics to fintech risk models.", "Offer data-modelling consulting for local businesses."],
  PH: ["Explore renewable-energy hardware prototyping.", "Combine physics with CS for simulation software."],
  EC: ["Design IoT products for smart agriculture.", "Embedded systems freelancing for startups."],
};
const RESOURCES: Record<string, { book: string; document: string; video: string }> = {
  default: {
    book: "Make It Stick — Brown, Roediger & McDaniel",
    document: "Course notes, worked examples, and previous exam papers",
    video: "Crash Course Study Skills (YouTube)",
  },
  CS: {
    book: "Introduction to Algorithms — Cormen et al.",
    document: "Lecture notes, algorithm walkthroughs, and previous problem sets",
    video: "MIT 6.006 OpenCourseWare lectures",
  },
  MA: {
    book: "Higher Engineering Mathematics — B.S. Grewal",
    document: "Formula sheets, solved examples, and previous exam papers",
    video: "3Blue1Brown — Essence of Linear Algebra",
  },
  PH: {
    book: "Concepts of Physics — H.C. Verma",
    document: "Concept summaries, lab notes, and previous exam papers",
    video: "Walter Lewin Physics Lectures (MIT)",
  },
  EC: {
    book: "Electronic Devices and Circuit Theory — Boylestad",
    document: "Circuit analysis notes, datasheets, and past exam papers",
    video: "NPTEL Analog Electronics",
  },
};
const prefix = (code: string) => code.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase();

export interface MentorPlan {
  strong: { subject: string; percent: number; ideas: string[] }[];
  developing: { subject: string; percent: number; guidance: string }[];
  weak: {
    subject: string;
    percent: number;
    plan: string[];
    book: string;
    document: string;
    video: string;
  }[];
}

export function mentorRecommendations(subjects: SubjectPerf[]): MentorPlan {
  return {
    strong: subjects
      .filter((s) => s.percent >= THRESHOLDS.strong)
      .map((s) => ({
        subject: `${s.course_code} · ${s.title}`,
        percent: s.percent,
        ideas: IDEAS[prefix(s.course_code)] ?? IDEAS.default,
      })),
    developing: subjects
      .filter((s) => s.percent >= THRESHOLDS.weak && s.percent < THRESHOLDS.strong)
      .map((s) => ({
        subject: `${s.course_code} · ${s.title}`,
        percent: s.percent,
        guidance: `Review your lowest-scoring units in ${s.title}, then complete an applied exercise to build toward 70%.`,
      })),
    weak: subjects
      .filter((s) => s.percent < THRESHOLDS.weak)
      .map((s) => {
        const r = RESOURCES[prefix(s.course_code)] ?? RESOURCES.default;
        return {
          subject: `${s.course_code} · ${s.title}`,
          percent: s.percent,
          book: r.book,
          document: r.document,
          video: r.video,
          plan: [
            `Week 1 — Rebuild fundamentals of ${s.title}: 45 min daily with the recommended text.`,
            "Week 2 — Solve previous IAT papers; review every mistake with a faculty mentor.",
            "Week 3 — Timed mock tests and spaced revision of weak units.",
          ],
        };
      }),
  };
}
