"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { OsceSpec } from "@/lib/schemas/osce";

const TONE_COLORS: Record<string, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  anxious: "bg-yellow-100 text-yellow-800",
  distressed: "bg-red-100 text-red-800",
  reassured: "bg-green-100 text-green-800",
  evasive: "bg-purple-100 text-purple-800",
  pain: "bg-orange-100 text-orange-800",
};

interface Props {
  spec: OsceSpec;
  onSpecChange?: (spec: OsceSpec) => void;
}

export function OsceSpecPreview({ spec }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Patient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Name" value={spec.patient.name} />
            <Stat label="Age" value={String(spec.patient.age)} />
            <Stat label="Sex" value={spec.patient.sex} />
          </div>
          <Separator className="my-2" />
          <Stat label="Chief Complaint" value={spec.patient.chief_complaint} />
          <Stat label="Backstory" value={spec.patient.backstory} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">States & Transitions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {spec.states.map((s) => (
            <div key={s.id} className="rounded-md border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{s.label}</span>
                {s.is_start && <Badge variant="outline" className="text-xs">start</Badge>}
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${TONE_COLORS[s.emotional_tone] ?? "bg-zinc-100 text-zinc-700"}`}>
                  {s.emotional_tone}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{s.system_prompt_suffix}</p>
            </div>
          ))}
          {spec.transitions.length > 0 && (
            <>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transitions</p>
              {spec.transitions.map((t, i) => (
                <div key={i} className="text-sm flex items-center gap-2">
                  <span className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{t.from}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{t.to}</span>
                  <span className="text-xs text-muted-foreground flex-1 text-right">{t.trigger}</span>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Evaluation Criteria
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {spec.evaluation_criteria.reduce((sum, c) => sum + c.points, 0)} pts total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {spec.evaluation_criteria.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span>{c.label}</span>
              <span className="font-medium tabular-nums">{c.points} pts</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Models</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-medium">Training</p>
            <Stat label="LLM" value={spec.modes.training.llm_model} />
            <Stat label="TTS" value={spec.modes.training.tts} />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Exam</p>
            <Stat label="LLM" value={spec.modes.exam.llm_model} />
            <Stat label="TTS" value={spec.modes.exam.tts} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}: </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
