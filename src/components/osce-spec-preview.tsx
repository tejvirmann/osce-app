"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { TTS_VOICES, type TtsVoiceKey } from "@/lib/schemas/osce";
import type { OsceSpec } from "@/lib/schemas/osce";

const enabledVoiceKeys = (process.env.NEXT_PUBLIC_ENABLED_VOICES ?? Object.keys(TTS_VOICES).join(","))
  .split(",").map((k) => k.trim()).filter((k) => k in TTS_VOICES) as TtsVoiceKey[];

const TONE_COLORS: Record<string, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  anxious: "bg-yellow-100 text-yellow-800",
  distressed: "bg-red-100 text-red-800",
  reassured: "bg-green-100 text-green-800",
  evasive: "bg-purple-100 text-purple-800",
  pain: "bg-orange-100 text-orange-800",
};

const TONES = ["neutral", "anxious", "distressed", "reassured", "evasive", "pain"] as const;

interface Props {
  spec: OsceSpec;
  onSpecChange?: (spec: OsceSpec) => void;
}

export function OsceSpecPreview({ spec, onSpecChange }: Props) {
  const editable = !!onSpecChange;

  function patch(update: Partial<OsceSpec>) {
    onSpecChange?.({ ...spec, ...update });
  }

  return (
    <div className="space-y-4">
      {/* Patient */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Patient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Name" value={spec.patient.name} editable={editable}
              onChange={(v) => patch({ patient: { ...spec.patient, name: v } })} />
            <Field label="Age" value={String(spec.patient.age)} editable={editable} type="number"
              onChange={(v) => patch({ patient: { ...spec.patient, age: Number(v) } })} />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sex</p>
              {editable ? (
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={spec.patient.sex}
                  onChange={(e) => patch({ patient: { ...spec.patient, sex: e.target.value } })}
                >
                  <option value="male">male</option>
                  <option value="female">female</option>
                  <option value="other">other</option>
                </select>
              ) : (
                <p>{spec.patient.sex}</p>
              )}
            </div>
          </div>
          <Field label="Chief Complaint" value={spec.patient.chief_complaint} editable={editable}
            onChange={(v) => patch({ patient: { ...spec.patient, chief_complaint: v } })} />
          <Field label="Backstory" value={spec.patient.backstory} editable={editable} multiline
            onChange={(v) => patch({ patient: { ...spec.patient, backstory: v } })} />
        </CardContent>
      </Card>

      {/* States & Transitions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">States & Transitions</CardTitle>
            {editable && (
              <Button size="xs" variant="outline" onClick={() => patch({
                  states: [...spec.states, {
                    id: `state_${nanoid(4)}`,
                    label: "New State",
                    emotional_tone: "neutral",
                    system_prompt_suffix: "",
                  }],
                })}
              >
                <PlusIcon className="h-3 w-3 mr-1" /> Add State
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {spec.states.map((s) => (
            <div key={s.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2">
                {editable ? (
                  <Input
                    className="h-7 text-sm font-medium flex-1"
                    value={s.label}
                    onChange={(e) => patch({
                      states: spec.states.map((st) =>
                        st.id === s.id ? { ...st, label: e.target.value } : st
                      ),
                    })}
                  />
                ) : (
                  <span className="font-medium text-sm flex-1">{s.label}</span>
                )}
                {s.is_start && <Badge variant="outline" className="text-xs shrink-0">start</Badge>}
                {editable ? (
                  <select
                    className="rounded-full text-xs px-2 py-0.5 font-medium border border-input bg-background"
                    value={s.emotional_tone}
                    onChange={(e) => patch({
                      states: spec.states.map((st) =>
                        st.id === s.id ? { ...st, emotional_tone: e.target.value as typeof TONES[number] } : st
                      ),
                    })}
                  >
                    {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TONE_COLORS[s.emotional_tone] ?? "bg-zinc-100 text-zinc-700"}`}>
                    {s.emotional_tone}
                  </span>
                )}
                {editable && !s.is_start && (
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => patch({
                      states: spec.states.filter((st) => st.id !== s.id),
                      transitions: spec.transitions.filter((t) => t.from !== s.id && t.to !== s.id),
                    })}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Field label="Patient is thinking..." value={s.system_prompt_suffix} editable={editable} multiline
                onChange={(v) => patch({
                  states: spec.states.map((st) =>
                    st.id === s.id ? { ...st, system_prompt_suffix: v } : st
                  ),
                })}
              />
            </div>
          ))}

          {spec.transitions.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transitions</p>
                {editable && (
                  <Button size="xs" variant="outline" nativeButton={false}
                    onClick={() => patch({
                      transitions: [...spec.transitions, {
                        from: spec.states[0]?.id ?? "",
                        to: spec.states[1]?.id ?? "",
                        trigger: "describe the trigger condition",
                      }],
                    })}
                  >
                    <PlusIcon className="h-3 w-3 mr-1" /> Add
                  </Button>
                )}
              </div>
              {spec.transitions.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  {editable ? (
                    <select className="rounded text-xs border border-input bg-background px-1.5 py-0.5 font-mono"
                      value={t.from}
                      onChange={(e) => patch({
                        transitions: spec.transitions.map((tr, j) =>
                          j === i ? { ...tr, from: e.target.value } : tr
                        ),
                      })}
                    >
                      {spec.states.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  ) : (
                    <span className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{t.from}</span>
                  )}
                  <span className="text-muted-foreground">→</span>
                  {editable ? (
                    <select className="rounded text-xs border border-input bg-background px-1.5 py-0.5 font-mono"
                      value={t.to}
                      onChange={(e) => patch({
                        transitions: spec.transitions.map((tr, j) =>
                          j === i ? { ...tr, to: e.target.value } : tr
                        ),
                      })}
                    >
                      {spec.states.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  ) : (
                    <span className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{t.to}</span>
                  )}
                  {editable ? (
                    <Input className="h-6 text-xs flex-1"
                      value={t.trigger}
                      onChange={(e) => patch({
                        transitions: spec.transitions.map((tr, j) =>
                          j === i ? { ...tr, trigger: e.target.value } : tr
                        ),
                      })}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground flex-1 text-right">{t.trigger}</span>
                  )}
                  {editable && (
                    <button className="text-muted-foreground hover:text-destructive"
                      onClick={() => patch({ transitions: spec.transitions.filter((_, j) => j !== i) })}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Criteria */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Evaluation Criteria
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {spec.evaluation_criteria.reduce((sum, c) => sum + c.points, 0)} pts total
              </span>
            </CardTitle>
            {editable && (
              <Button size="xs" variant="outline" onClick={() => patch({
                  evaluation_criteria: [...spec.evaluation_criteria, {
                    id: `crit_${nanoid(4)}`,
                    label: "New criterion",
                    points: 10,
                  }],
                })}
              >
                <PlusIcon className="h-3 w-3 mr-1" /> Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {spec.evaluation_criteria.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-sm">
              {editable ? (
                <>
                  <Input className="h-7 flex-1 text-sm" value={c.label}
                    onChange={(e) => patch({
                      evaluation_criteria: spec.evaluation_criteria.map((cr) =>
                        cr.id === c.id ? { ...cr, label: e.target.value } : cr
                      ),
                    })}
                  />
                  <Input className="h-7 w-16 text-sm text-right" type="number" value={c.points}
                    onChange={(e) => patch({
                      evaluation_criteria: spec.evaluation_criteria.map((cr) =>
                        cr.id === c.id ? { ...cr, points: Number(e.target.value) } : cr
                      ),
                    })}
                  />
                  <span className="text-xs text-muted-foreground">pts</span>
                  <button className="text-muted-foreground hover:text-destructive"
                    onClick={() => patch({
                      evaluation_criteria: spec.evaluation_criteria.filter((cr) => cr.id !== c.id),
                    })}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">{c.label}</span>
                  <span className="font-medium tabular-nums">{c.points} pts</span>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Models */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Models</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          {(["training", "exam"] as const).map((mode) => {
            const voiceKey = (spec.modes[mode].tts_voice ?? "openai-nova") as TtsVoiceKey;
            return (
              <div key={mode} className="space-y-2">
                <p className="font-medium capitalize">{mode}</p>
                <Field label="LLM" value={spec.modes[mode].llm_model} editable={editable}
                  onChange={(v) => patch({
                    modes: { ...spec.modes, [mode]: { ...spec.modes[mode], llm_model: v } },
                  })}
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Voice</p>
                  {editable ? (
                    <select
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={voiceKey}
                      onChange={(e) => patch({
                        modes: { ...spec.modes, [mode]: { ...spec.modes[mode], tts_voice: e.target.value as TtsVoiceKey } },
                      })}
                    >
                      {enabledVoiceKeys.map((k) => (
                        <option key={k} value={k}>{TTS_VOICES[k].label} — {TTS_VOICES[k].description}</option>
                      ))}
                    </select>
                  ) : (
                    <p>{TTS_VOICES[voiceKey]?.label ?? voiceKey}</p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label, value, editable, onChange, multiline, type,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange?: (v: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  if (!editable) {
    return (
      <div>
        <span className="text-xs text-muted-foreground">{label}: </span>
        <span className="text-sm">{value}</span>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {multiline ? (
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm min-h-[60px] resize-y"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <Input className="h-7 text-sm" type={type ?? "text"} value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
    </div>
  );
}
