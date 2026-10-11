// Client-side data layer. When VITE_API_URL is set, see src/lib/api.ts for FastAPI calls;
// otherwise this localStorage store provides a fully working demo.
import { useSyncExternalStore } from "react";
import {
  type Assessment, type Attendance, type Intervention, type Student,
  attendancePercent, attendanceRisk, averageMark, markRisk, overallRisk, riskReason,
} from "./evaluation";

interface DB { students: Student[]; attendance: Attendance[]; assessments: Assessment[]; interventions: Intervention[]; seq: number }
const KEY = "spra-db-v1";

function seed(): DB {
  const students: Student[] = [
    ["STU001", "Aarav", "Sharma", "Computer Science", 5],
    ["STU002", "Diya", "Patel", "Electronics", 3],
    ["STU003", "Rohan", "Iyer", "Mechanical", 5],
    ["STU004", "Meera", "Nair", "Computer Science", 7],
    ["STU005", "Kabir", "Reddy", "Electronics", 3],
    ["STU006", "Ananya", "Gupta", "Mathematics", 1],
  ].map(([id, f, l, d, s]) => ({
    student_id: id as string, first_name: f as string, last_name: l as string,
    email: `${(f as string).toLowerCase()}.${(l as string).toLowerCase()}@college.edu`, department: d as string, semester: s as number,
  }));
  const courses = [["CS301", "Data Structures"], ["MA201", "Engineering Mathematics"], ["PH101", "Applied Physics"]];
  const profiles = [[82, 0.95], [45, 0.6], [58, 0.72], [74, 0.88], [52, 0.68], [66, 0.8]];
  let id = 1;
  const assessments: Assessment[] = [];
  const attendance: Attendance[] = [];
  students.forEach((st, i) => {
    const [base, att] = profiles[i];
    courses.forEach(([code, title], c) => {
      const t: [Assessment["assessment_type"], number][] = [["IAT1", 50], ["IAT2", 50], ["EndSem", 100]];
      t.forEach(([type, max], k) => {
        const pct = Math.min(100, Math.max(15, base + ((c * 7 + k * 5 + i * 3) % 21) - 10));
        assessments.push({ id: id++, student_id: st.student_id, course_code: code, title, assessment_type: type, score: Math.round((pct / 100) * max), max_score: max });
      });
    });
    for (let d = 0; d < 20; d++) {
      const date = new Date(2026, 8, 1 + d);
      if (date.getDay() === 0) continue;
      attendance.push({ id: id++, student_id: st.student_id, date: date.toISOString().slice(0, 10), status: ((d * 37 + i * 11) % 100) / 100 < att ? "Present" : "Absent" });
    }
  });
  const db: DB = { students, attendance, assessments, interventions: [], seq: id };
  students.forEach((s) => evaluate(db, s.student_id));
  return db;
}

function evaluate(db: DB, sid: string) {
  const avg = averageMark(db.assessments.filter((a) => a.student_id === sid));
  const att = attendancePercent(db.attendance.filter((a) => a.student_id === sid));
  const risk = overallRisk(markRisk(avg), attendanceRisk(att));
  const existing = db.interventions.find((i) => i.student_id === sid);
  if (existing) {
    if (existing.risk_level !== risk) existing.status = "Pending";
    existing.risk_level = risk; existing.reason = riskReason(avg, att);
  } else db.interventions.push({ id: db.seq++, student_id: sid, risk_level: risk, reason: riskReason(avg, att), status: risk === "Low" ? "Resolved" : "Pending" });
}

let db: DB | null = null;
const listeners = new Set<() => void>();
function get(): DB {
  if (!db) {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    db = raw ? JSON.parse(raw) : seed();
  }
  return db!;
}
function commit(mut: (d: DB) => void) {
  const next: DB = structuredClone(get());
  mut(next); db = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useDB(): DB {
  return useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), get, get);
}

export const actions = {
  addStudent(s: Student) {
    commit((d) => {
      if (d.students.some((x) => x.student_id === s.student_id)) throw new Error(`Student ${s.student_id} already exists`);
      d.students.push(s); evaluate(d, s.student_id);
    });
  },
  addStudents(list: Student[]) {
    let added = 0;
    commit((d) => list.forEach((s) => { if (!d.students.some((x) => x.student_id === s.student_id)) { d.students.push(s); evaluate(d, s.student_id); added++; } }));
    return added;
  },
  deleteStudent(sid: string) {
    commit((d) => {
      d.students = d.students.filter((s) => s.student_id !== sid);
      d.attendance = d.attendance.filter((s) => s.student_id !== sid);
      d.assessments = d.assessments.filter((s) => s.student_id !== sid);
      d.interventions = d.interventions.filter((s) => s.student_id !== sid);
    });
  },
  toggleIntervention(sid: string) {
    commit((d) => d.interventions.filter((i) => i.student_id === sid).forEach((i) => (i.status = i.status === "Pending" ? "Resolved" : "Pending")));
  },
  addAssessments(list: Omit<Assessment, "id">[]) {
    commit((d) => {
      const ids = new Set<string>();
      list.forEach((a) => { if (d.students.some((s) => s.student_id === a.student_id)) { d.assessments.push({ ...a, id: d.seq++ }); ids.add(a.student_id); } });
      ids.forEach((sid) => evaluate(d, sid));
    });
  },
  deleteAssessment(id: number) {
    commit((d) => {
      const a = d.assessments.find((x) => x.id === id);
      d.assessments = d.assessments.filter((x) => x.id !== id);
      if (a) evaluate(d, a.student_id);
    });
  },
  bulkAttendance(date: string, records: { student_id: string; status: Attendance["status"] }[]) {
    commit((d) => {
      records.forEach((r) => {
        d.attendance = d.attendance.filter((a) => !(a.student_id === r.student_id && a.date === date));
        d.attendance.push({ id: d.seq++, date, ...r });
        evaluate(d, r.student_id);
      });
    });
  },
  reset() { commit((d) => Object.assign(d, seed())); },
};

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const head = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((l) => {
    const cells = l.split(",").map((c) => c.trim());
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""]));
  });
}
