import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { parseCSV } from "@/lib/store";

export function CsvDropzone({ onRows, columns }: { onRows: (rows: Record<string, string>[], name: string) => void; columns: string[] }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  async function read(file?: File) {
    if (!file) return;
    if (file.size > 2_000_000) return alert("File must be under 2 MB");
    onRows(parseCSV(await file.text()), file.name);
  }
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); read(e.dataTransfer.files[0]); }}
      onClick={() => ref.current?.click()}
      className={`cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors ${over ? "border-primary bg-accent" : "border-input bg-card hover:bg-secondary"}`}>
      <FileUp className="mx-auto h-10 w-10 text-primary" />
      <p className="mt-3 font-medium">Drag &amp; drop a CSV file, or click to browse</p>
      <p className="mt-1 text-xs text-muted-foreground">Required columns: <span className="font-mono">{columns.join(", ")}</span></p>
      <input ref={ref} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => read(e.target.files?.[0])} />
    </div>
  );
}
