"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";

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
    } catch {
      toast.error("Publish failed. Check Dograh connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handlePublish} disabled={loading}>
      <SendIcon className="mr-1.5 h-3.5 w-3.5" />
      {loading ? "Publishing..." : "Publish"}
    </Button>
  );
}
