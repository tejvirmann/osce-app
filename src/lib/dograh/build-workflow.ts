import { TTS_VOICES, type TtsVoiceKey } from "@/lib/schemas/osce";
import type { OsceSpec } from "@/lib/schemas/osce";

export function buildDograhWorkflow(spec: OsceSpec, mode: "training" | "exam") {
  const startState = spec.states.find((s) => s.is_start) ?? spec.states[0];
  const otherStates = spec.states.filter((s) => s.id !== startState.id);

  const modeConfig = spec.modes[mode];
  const voiceKey = (modeConfig.tts_voice ?? "openai-nova") as TtsVoiceKey;
  const ttsConfig = TTS_VOICES[voiceKey]?.dograh ?? TTS_VOICES["elevenlabs-rachel"].dograh;

  const globalNode = {
    id: "global",
    type: "globalNode",
    position: { x: 100, y: 60 },
    data: {
      name: "Global Node",
      prompt: buildGlobalPrompt(spec, mode),
      tts_provider: ttsConfig.tts_provider,
      tts_model: ttsConfig.tts_model,
      ...(ttsConfig.voice_id ? { voice_id: ttsConfig.voice_id } : {}),
    },
  };

  const startNode = {
    id: startState.id,
    type: "startCall",
    position: { x: 600, y: 60 },
    data: {
      name: startState.label,
      greeting: `Hello.`,
      greeting_type: "text",
      prompt: buildStatePrompt(startState),
      allow_interrupt: false,
      add_global_prompt: true,
      is_start: true,
    },
  };

  const agentNodes = otherStates.map((state, i) => ({
    id: state.id,
    type: "agentNode",
    position: { x: 600 + (i + 1) * 600, y: 60 },
    data: {
      name: state.label,
      prompt: buildStatePrompt(state),
      allow_interrupt: true,
      add_global_prompt: true,
    },
  }));

  const endNode = {
    id: "end",
    type: "endCall",
    position: { x: 600 + (otherStates.length + 1) * 600, y: 60 },
    data: {
      name: "End Call",
      is_end: true,
      add_global_prompt: false,
      prompt:
        "The conversation is complete. Thank the student briefly and end the call.",
    },
  };

  // Transition edges from spec (exclude any that target the start node — startCall cannot have incoming edges)
  const transitionEdges = spec.transitions.filter((t) => t.to !== startState.id).map((t) => ({
    id: `${t.from}-${t.to}`,
    animated: true,
    type: "custom",
    source: t.from,
    target: t.to,
    data: { condition: t.trigger, label: t.trigger },
  }));

  // Every state gets an end-call edge
  const endEdges = spec.states.map((s) => ({
    id: `${s.id}-end`,
    animated: true,
    type: "custom",
    source: s.id,
    target: "end",
    data: {
      condition:
        "Choose this pathway when the conversation has naturally concluded or the student says goodbye",
      label: "End call",
    },
  }));

  return {
    nodes: [globalNode, startNode, ...agentNodes, endNode],
    edges: [...transitionEdges, ...endEdges],
  };
}

function buildGlobalPrompt(spec: OsceSpec, mode: "training" | "exam") {
  const modeNote =
    mode === "training"
      ? "This is a TRAINING session — the AI patient may give mild hints if the student is completely lost."
      : "This is an EXAM session — stay strictly in character with no hints.";

  return `# Patient Persona
You are ${spec.patient.name}, a ${spec.patient.age}-year-old ${spec.patient.sex}.
Chief complaint: ${spec.patient.chief_complaint}

## Backstory
${spec.patient.backstory}

## Mode
${modeNote}

## Behaviour Rules
- You are on a phone call with a medical student who is being assessed
- Speak naturally as a real patient — no medical jargon, no bullet points, no formatting
- Keep responses brief and conversational (this is voice)
- Stay in character at all times; do not break the fourth wall
- If audio is unclear, say: "Sorry, I didn't quite catch that."
- Never reveal that you are an AI`;
}

function buildStatePrompt(state: { emotional_tone: string; system_prompt_suffix: string }) {
  return `# Current emotional state: ${state.emotional_tone}

${state.system_prompt_suffix}

Transition to the next state when the appropriate condition is met. End the call when the conversation is fully complete.`;
}
