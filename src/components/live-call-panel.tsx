"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneIcon, PhoneOffIcon, RefreshCwIcon } from "lucide-react";
import { StepProgress } from "@/components/step-progress";
import { WorkflowGraph } from "@/components/workflow-graph";
import type { OsceSpec } from "@/lib/schemas/osce";

const CALL_STEPS = [
  { label: "Connecting to Dograh...", delayMs: 0 },
  { label: "Initiating outbound call...", delayMs: 600 },
  { label: "Calling your phone now...", delayMs: 1200 },
];

interface RunState {
  runId: number;
  workflowId: string;
  isCompleted: boolean;
  activeStateId: string | null;
  visitedStateIds: string[];
  transcriptUrl: string | null;
  recordingUrl: string | null;
}

type RtfEvent = { type: string; node_id: string; node_name: string; timestamp: string };

// Use realtime_feedback_events[].rtf-node-transition for exact current node.
// node_id matches our OSCE state IDs directly (e.g. "initial", "history_taking").
function extractStateFromEvents(events: RtfEvent[] | undefined, spec: OsceSpec): {
  activeStateId: string | null;
  visitedStateIds: string[];
} {
  const startId = spec.states.find((s) => s.is_start)?.id ?? null;
  if (!events?.length) return { activeStateId: startId, visitedStateIds: startId ? [startId] : [] };

  const transitions = events.filter((e) => e.type === "rtf-node-transition");
  if (!transitions.length) return { activeStateId: startId, visitedStateIds: startId ? [startId] : [] };

  const stateIds = new Set(spec.states.map((s) => s.id));
  const visited: string[] = [];
  for (const t of transitions) {
    if (stateIds.has(t.node_id) && !visited.includes(t.node_id)) visited.push(t.node_id);
  }
  const last = transitions[transitions.length - 1];
  const activeStateId = stateIds.has(last.node_id) ? last.node_id : startId;
  return { activeStateId, visitedStateIds: visited };
}

interface Props {
  scenarioId: string;
  workflowId: string | null;
  spec: OsceSpec;
  disabled?: boolean;
}

export function LiveCallPanel({ scenarioId, workflowId, spec, disabled }: Props) {
  const [phone, setPhone] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [runState, setRunState] = useState<RunState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollRunStatus = useCallback(async (runId: number) => {
    try {
      const res = await fetch(`/api/osces/${scenarioId}/run-status?runId=${runId}`);
      if (!res.ok) return;
      const data = await res.json() as {
        is_completed: boolean;
        transcript_url: string | null;
        recording_url: string | null;
        logs: { realtime_feedback_events?: RtfEvent[] } | null;
      };
      const events = data.logs?.realtime_feedback_events;
      const { activeStateId, visitedStateIds } = data.is_completed
        ? { activeStateId: null, visitedStateIds: extractStateFromEvents(events, spec).visitedStateIds }
        : extractStateFromEvents(events, spec);
      setRunState((prev) => prev ? {
        ...prev,
        isCompleted: data.is_completed,
        activeStateId,
        visitedStateIds,
        transcriptUrl: data.transcript_url,
        recordingUrl: data.recording_url,
      } : null);
      if (data.is_completed) stopPolling();
    } catch {
      // ignore transient errors
    }
  }, [scenarioId, spec, stopPolling]);

  const startPolling = useCallback((runId: number) => {
    stopPolling();
    pollRef.current = setInterval(() => pollRunStatus(runId), 2500);
  }, [pollRunStatus, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  async function handleCall() {
    if (!phone.trim()) { toast.error("Enter your phone number first"); return; }
    setInitiating(true);
    try {
      const res = await fetch(`/api/osces/${scenarioId}/test-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.trim() }),
      });
      const data = await res.json() as { runId?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const startState = spec.states.find((s) => s.is_start);
      setRunState({
        runId: data.runId!,
        workflowId: workflowId ?? "",
        isCompleted: false,
        activeStateId: startState?.id ?? null,
        visitedStateIds: startState ? [startState.id] : [],
        transcriptUrl: null,
        recordingUrl: null,
      });
      startPolling(data.runId!);
      toast.success(`Calling ${phone} — run #${data.runId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate call");
    } finally {
      setInitiating(false);
    }
  }

  function handleReset() {
    stopPolling();
    setRunState(null);
  }

  const activeState = runState?.activeStateId
    ? spec.states.find((s) => s.id === runState.activeStateId)
    : null;

  return (
    <div className="space-y-4">
      {/* Graph */}
      <WorkflowGraph
        spec={spec}
        activeStateId={runState?.activeStateId}
        visitedStateIds={runState?.visitedStateIds}
        className="h-72"
      />

      {/* Active state callout */}
      {runState && !runState.isCompleted && activeState && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Patient is currently: <span className="font-semibold">{activeState.label}</span>
            </p>
            <p className="text-xs text-blue-600">{activeState.emotional_tone} · {activeState.system_prompt_suffix.slice(0, 80)}{activeState.system_prompt_suffix.length > 80 ? "…" : ""}</p>
          </div>
        </div>
      )}

      {/* Completed callout */}
      {runState?.isCompleted && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
          <p className="font-medium text-green-900">Call completed</p>
          <div className="mt-1 flex gap-3 text-xs text-green-700">
            {runState.transcriptUrl && (
              <a href={runState.transcriptUrl} target="_blank" rel="noopener noreferrer" className="underline">
                View transcript
              </a>
            )}
            {runState.recordingUrl && (
              <a href={runState.recordingUrl} target="_blank" rel="noopener noreferrer" className="underline">
                Listen to recording
              </a>
            )}
          </div>
        </div>
      )}

      {/* Call controls */}
      {!runState ? (
        <div className="space-y-3">
          <StepProgress steps={CALL_STEPS} active={initiating} />
          <div className="space-y-1.5">
            <Label htmlFor="test-phone">Your phone number</Label>
            <Input
              id="test-phone"
              type="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={disabled || initiating}
            />
            <p className="text-xs text-muted-foreground">Dograh will call this number using your configured Twilio account.</p>
          </div>
          <Button className="w-full" onClick={handleCall} disabled={disabled || initiating || !phone.trim()}>
            <PhoneIcon className="mr-2 h-4 w-4" />
            {initiating ? "Calling..." : "Call Me (Training Mode)"}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          {runState.isCompleted ? (
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              New Call
            </Button>
          ) : (
            <div className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="flex-1 text-sm font-medium">Call in progress — run #{runState.runId}</span>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <PhoneOffIcon className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
