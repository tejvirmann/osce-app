import { NextRequest, NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";
import { OsceSpecSchema } from "@/lib/schemas/osce";
import { z } from "zod";
import { nanoid } from "nanoid";

const EXTRACT_SYSTEM_PROMPT = `You are an OSCE scenario parser. Given a clinical scenario description, extract a structured OSCE Spec JSON object.

The JSON must match this exact shape:
{
  "id": "<slug>",
  "title": "<short title>",
  "patient": {
    "name": "<name>",
    "age": <number>,
    "sex": "<male|female|other>",
    "chief_complaint": "<one sentence>",
    "backstory": "<2-3 sentences of relevant history>",
    "voice_profile": "<descriptor like middle_aged_female_anxious>"
  },
  "modes": {
    "training": {
      "llm_provider": "openrouter",
      "llm_model": "meta-llama/llama-3.1-8b-instruct",
      "tts": "chatterbox",
      "tts_exaggeration": 0.4
    },
    "exam": {
      "llm_provider": "openrouter",
      "llm_model": "anthropic/claude-sonnet-4-6",
      "tts": "elevenlabs-turbo-v2.5"
    }
  },
  "states": [
    {
      "id": "initial",
      "label": "<short label>",
      "emotional_tone": "<neutral|anxious|distressed|reassured|evasive|pain>",
      "system_prompt_suffix": "<what the patient is thinking/feeling right now, 2-3 sentences>",
      "is_start": true
    }
    // add 2-4 more states as appropriate
  ],
  "transitions": [
    { "from": "<state_id>", "to": "<state_id>", "trigger": "<natural language trigger condition>" }
  ],
  "narrator_events": [],
  "evaluation_criteria": [
    { "id": "<slug>", "label": "<what the student should do>", "points": <5-15> }
    // 5-8 criteria totalling 100 points
  ]
}

Return only valid JSON. No markdown fences, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let text = "";

    if (contentType.includes("multipart/form-data")) {
      // PDF upload — extract text via OpenRouter vision (GPT-4o supports PDF)
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");

      const res = await openrouter.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: EXTRACT_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the OSCE Spec from this document." },
              { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } },
            ],
          },
        ],
      });
      text = res.choices[0].message.content ?? "";
    } else {
      const { description } = await req.json() as { description: string };
      if (!description) return NextResponse.json({ error: "No description provided" }, { status: 400 });

      const res = await openrouter.chat.completions.create({
        model: "anthropic/claude-sonnet-4-6",
        messages: [
          { role: "system", content: EXTRACT_SYSTEM_PROMPT },
          { role: "user", content: description },
        ],
      });
      text = res.choices[0].message.content ?? "";
    }

    const raw = JSON.parse(text);
    // Stamp a fresh id so duplicates don't collide
    raw.id = `osce_${nanoid(8)}`;
    const spec = OsceSpecSchema.parse(raw);
    return NextResponse.json({ spec });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Spec validation failed", issues: err.issues }, { status: 422 });
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "LLM returned invalid JSON" }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
