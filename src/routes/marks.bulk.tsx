import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CsvDropzone } from "@/components/CsvDropzone";
import { Notice, PageHeader } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { actions, useDB } from "@/lib/store";
import { meta } from "@/lib/meta";
import { markSchema } from "./marks.new";

export const Route = createFileRoute("/marks/bulk")({
  head: () => meta("Bulk Upload Marks", "Import assessment marks for many students from CSV."),
  component: () => <AppShell><Bulk /></AppShell>,
});

const cols = ["student_id", "course_code", "title", "assessment_type", "score", "max_score"];

function Bulk() {
  const db = useDB();
  const [rows, setRows] = useState<{ ok: boolean; data: Record<string, string>; err?: string }[]>([]);
  const [msg, setMsg] = useState("");
  const valid = rows.filter((r) => r.ok);
  return (
    <>
      <PageHeader title="Bulk Upload Marks" subtitle="Import IAT-1, IAT-2 and End Sem scores. Unknown student IDs are rejected." />
      <CsvDropzone columns={cols} onRows={(rs) => { setMsg(""); setRows(rs.map((d) => {
        const p = markSchema.safeParse(d);
        if (!p.success) return { ok: false, data: d, err: p.error.issues[0].message };
        if (!db.students.some((s) => s.student_id === p.data.student_id)) return { ok: false, data: d, err: "Unknown student ID" };
        return { ok: true, data: d };
      })); }} />
      {msg && <div className="mt-4"><Notice kind="ok">{msg}</Notice></div>}
      {rows.length > 0 && (
        <div className="mt-6 rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-4"><span className="text-sm">{valid.length} valid · {rows.length - valid.length} with errors</span>
            <Button disabled={!valid.length} onClick={() => { actions.addAssessments(valid.map((r) => markSchema.parse(r.data))); setMsg(`${valid.length} assessment records imported.`); setRows([]); }}>Import {valid.length} records</Button></div>
          <div className="max-h-96 overflow-auto"><table className="w-full text-sm"><thead className="bg-secondary text-left text-xs uppercase text-muted-foreground"><tr>{cols.map((c) => <th key={c} className="px-3 py-2">{c}</th>)}<th className="px-3 py-2">Validation</th></tr></thead>
            <tbody className="divide-y">{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c} className="px-3 py-2">{r.data[c]}</td>)}<td className={`px-3 py-2 text-xs ${r.ok ? "text-risk-low" : "text-risk-high"}`}>{r.ok ? "OK" : r.err}</td></tr>)}</tbody></table></div>
        </div>
      )}
    </>
  );
}
