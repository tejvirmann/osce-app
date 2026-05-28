"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";
import { StepProgress } from "@/components/step-progress";

const PUBLISH_STEPS = [
  { label: "Building workflow definitions...", delayMs: 0 },
  { label: "Creating training workflow in Dograh...", delayMs: 800 },
  { label: "Creating exam workflow in Dograh...", delayMs: 800 },
  { label: "Publishing both workflows...", delayMs: 2000 },
  { label: "Saving to database...", delayMs: 3500 },
];

export function PublishButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/osces/${id}/publish`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Scenario published.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed. Check Dograh connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <StepProgress steps={PUBLISH_STEPS} active={loading} />
      <Button size="sm" onClick={handlePublish} disabled={loading}>
        <SendIcon className="mr-1.5 h-3.5 w-3.5" />
        {loading ? "Publishing..." : "Publish"}
      </Button>
    </div>
  );
}
