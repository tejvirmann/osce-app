"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OsceSpecPreview } from "@/components/osce-spec-preview";
import { WorkflowGraph } from "@/components/workflow-graph";
import type { OsceSpec } from "@/lib/schemas/osce";

interface Props {
  id: string;
  initialSpec: OsceSpec;
}

export function ScenarioEditor({ id, initialSpec }: Props) {
  const [spec, setSpec] = useState<OsceSpec>(initialSpec);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleChange(updated: OsceSpec) {
    setSpec(updated);
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/osces/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDirty(false);
      toast.success("Saved.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {dirty && (
        <div className="flex items-center justify-between rounded-md border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
          <span>Unsaved changes</span>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Workflow Graph</p>
        <WorkflowGraph spec={spec} className="h-64" />
      </div>
      <OsceSpecPreview spec={spec} onSpecChange={handleChange} />
    </div>
  );
}
