"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, SparklesIcon, UploadIcon } from "lucide-react";
import type { OsceSpec } from "@/lib/schemas/osce";
import { OsceSpecPreview } from "@/components/osce-spec-preview";
import { StepProgress } from "@/components/step-progress";

type PageStep = "input" | "preview";

const EXTRACT_STEPS = [
  { label: "Sending scenario to Claude...", delayMs: 0 },
  { label: "Parsing patient demographics...", delayMs: 4000 },
  { label: "Building patient state machine...", delayMs: 9000 },
  { label: "Generating evaluation criteria...", delayMs: 16000 },
  { label: "Validating OSCE spec...", delayMs: 23000 },
];

const SAVE_STEPS = [
  { label: "Saving scenario to database...", delayMs: 0 },
  { label: "Redirecting to editor...", delayMs: 800 },
];

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<PageStep>("input");
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [spec, setSpec] = useState<OsceSpec | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleExtract() {
    setExtracting(true);
    try {
      let res: Response;
      if (mode === "pdf" && file) {
        const form = new FormData();
        form.append("file", file);
        res = await fetch("/api/osces/extract", { method: "POST", body: form });
      } else {
        res = await fetch("/api/osces/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        });
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { spec: OsceSpec };
      setSpec(data.spec);
      setStep("preview");
    } catch {
      toast.error("Failed to extract OSCE spec. Try again.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave() {
    if (!spec) return;
    setSaving(true);
    try {
      const res = await fetch("/api/osces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: spec.title, spec }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { id: string };
      toast.success("Scenario saved as draft.");
      router.push(`/osces/${data.id}`);
    } catch {
      toast.error("Failed to save scenario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Create OSCE Scenario</h1>
            <p className="text-sm text-muted-foreground">
              {step === "input" ? "Describe your scenario" : "Review and save"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {step === "input" ? (
          <Card>
            <CardHeader>
              <CardTitle>Scenario Input</CardTitle>
              <CardDescription>
                Paste a text description or upload a PDF. The AI will extract the OSCE spec.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Button
                  variant={mode === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("text")}
                >
                  Text
                </Button>
                <Button
                  variant={mode === "pdf" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("pdf")}
                >
                  PDF Upload
                </Button>
              </div>

              <Separator />

              {mode === "text" ? (
                <div className="space-y-2">
                  <Label htmlFor="description">Scenario Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A 45-year-old woman presents to the emergency department with chest pain radiating to her left arm for the past 20 minutes. She is anxious and has no prior cardiac history..."
                    className="min-h-48 resize-y"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={extracting}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="pdf">Upload PDF</Label>
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 py-10 cursor-pointer hover:bg-zinc-100 transition-colors"
                    onClick={() => document.getElementById("pdf-input")?.click()}
                  >
                    <UploadIcon className="mb-2 h-8 w-8 text-zinc-400" />
                    {file ? (
                      <p className="text-sm font-medium">{file.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click to select a PDF</p>
                    )}
                  </div>
                  <input
                    id="pdf-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              )}

              <StepProgress steps={EXTRACT_STEPS} active={extracting} />

              <Button
                className="w-full"
                onClick={handleExtract}
                disabled={extracting || (mode === "text" ? !description.trim() : !file)}
              >
                <SparklesIcon className="mr-2 h-4 w-4" />
                {extracting ? "Working..." : "Extract OSCE Spec"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          spec && (
            <div className="space-y-6">
              <OsceSpecPreview spec={spec} onSpecChange={setSpec} />
              <div className="space-y-3">
                <StepProgress steps={SAVE_STEPS} active={saving} />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("input")} disabled={saving}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save as Draft"}
                  </Button>
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
