"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneIcon } from "lucide-react";
import { StepProgress } from "@/components/step-progress";

const CALL_STEPS = [
  { label: "Connecting to Dograh...", delayMs: 0 },
  { label: "Initiating outbound call...", delayMs: 600 },
  { label: "Calling your phone now...", delayMs: 1200 },
];

interface Props {
  scenarioId: string;
  disabled?: boolean;
}

export function TestCallButton({ scenarioId, disabled }: Props) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCall() {
    if (!phone.trim()) { toast.error("Enter your phone number first"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/osces/${scenarioId}/test-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.trim() }),
      });
      const data = await res.json() as { runId?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Calling ${phone} now — run #${data.runId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate call");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <StepProgress steps={CALL_STEPS} active={loading} />
      <div className="space-y-1.5">
        <Label htmlFor="test-phone">Your phone number</Label>
        <Input
          id="test-phone"
          type="tel"
          placeholder="+1 555 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={disabled || loading}
        />
        <p className="text-xs text-muted-foreground">Dograh will call this number using your configured Twilio account.</p>
      </div>
      <Button className="w-full" onClick={handleCall} disabled={disabled || loading || !phone.trim()}>
        <PhoneIcon className="mr-2 h-4 w-4" />
        {loading ? "Calling..." : "Call Me (Training Mode)"}
      </Button>
    </div>
  );
}
