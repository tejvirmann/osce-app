import { z } from "zod";

export const PatientSchema = z.object({
  name: z.string(),
  age: z.number(),
  sex: z.string(),
  chief_complaint: z.string(),
  backstory: z.string(),
  voice_profile: z.string(),
});

export const ModeConfigSchema = z.object({
  llm_provider: z.literal("openrouter"),
  llm_model: z.string(),
  tts: z.string(),
  tts_exaggeration: z.number().optional(),
  voice_id: z.string().optional(),
});

export const StateSchema = z.object({
  id: z.string(),
  label: z.string(),
  emotional_tone: z.enum(["neutral", "anxious", "distressed", "reassured", "evasive", "pain"]),
  system_prompt_suffix: z.string(),
  is_start: z.boolean().optional(),
});

export const TransitionSchema = z.object({
  from: z.string(),
  to: z.string(),
  trigger: z.string(),
});

export const NarratorEventSchema = z.object({
  id: z.string(),
  trigger: z.string(),
  action: z.enum(["speak", "sms"]),
  text: z.string(),
  delay_seconds: z.number().optional(),
});

export const EvaluationCriterionSchema = z.object({
  id: z.string(),
  label: z.string(),
  points: z.number(),
});

export const OsceSpecSchema = z.object({
  id: z.string(),
  title: z.string(),
  patient: PatientSchema,
  modes: z.object({
    training: ModeConfigSchema,
    exam: ModeConfigSchema,
  }),
  states: z.array(StateSchema).min(1),
  transitions: z.array(TransitionSchema),
  narrator_events: z.array(NarratorEventSchema).optional().default([]),
  evaluation_criteria: z.array(EvaluationCriterionSchema).min(1),
});

export type OsceSpec = z.infer<typeof OsceSpecSchema>;
export type PatientState = z.infer<typeof StateSchema>;
export type EvaluationCriterion = z.infer<typeof EvaluationCriterionSchema>;
