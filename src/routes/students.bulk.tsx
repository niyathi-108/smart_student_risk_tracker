import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CsvDropzone } from "@/components/CsvDropzone";
import { Notice, PageHeader } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { actions } from "@/lib/store";
import { meta } from "@/lib/meta";
import { studentSchema } from "./students.new";

export const Route = createFileRoute("/students/bulk")({
  head: () => meta("Bulk Upload Students", "Import multiple student records from a CSV file."),
  component: () => <AppShell><Bulk /></AppShell>,
});

const cols = ["student_id", "first_name", "last_name", "email", "department", "semester"];

function Bulk() {
  const [rows, setRows] = useState<{ ok: boolean; data: Record<string, string>; err?: string }[]>([]);
  const [msg, setMsg] = useState("");
  const valid = rows.filter((r) => r.ok);
  return (
    <>
      <PageHeader title="Bulk Upload Students" subtitle="Import a CSV file. Rows are validated before saving." />
      <CsvDropzone columns={cols} onRows={(rs) => { setMsg(""); setRows(rs.map((d) => { const p = studentSchema.safeParse(d); return { ok: p.success, data: d, err: p.success ? undefined : p.error.issues[0].message }; })); }} />
      {msg && <div className="mt-4"><Notice kind="ok">{msg}</Notice></div>}
      {rows.length > 0 && (
        <div className="mt-6 rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-4"><span className="text-sm">{valid.length} valid · {rows.length - valid.length} with errors</span>
            <Button disabled={!valid.length} onClick={() => { const n = actions.addStudents(valid.map((r) => studentSchema.parse(r.data))); setMsg(`${n} students imported (duplicates skipped).`); setRows([]); }}>Import {valid.length} students</Button></div>
          <div className="max-h-96 overflow-auto"><table className="w-full text-sm"><thead className="bg-secondary text-left text-xs uppercase text-muted-foreground"><tr>{cols.map((c) => <th key={c} className="px-3 py-2">{c}</th>)}<th className="px-3 py-2">Validation</th></tr></thead>
            <tbody className="divide-y">{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c} className="px-3 py-2">{r.data[c]}</td>)}<td className={`px-3 py-2 text-xs ${r.ok ? "text-risk-low" : "text-risk-high"}`}>{r.ok ? "OK" : r.err}</td></tr>)}</tbody></table></div>
        </div>
      )}
    </>
  );
}
