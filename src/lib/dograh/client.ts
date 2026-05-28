const base = process.env.DOGRAH_API_URL ?? "http://localhost:8000";
const key = process.env.DOGRAH_API_KEY ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": key,
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Dograh ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type DograhWorkflow = {
  id: number;
  name: string;
  status: string;
  workflow_uuid: string | null;
  workflow_definition: Record<string, unknown>;
};

export type RtfEvent = {
  type: string;
  timestamp: string;
  turn: number;
  node_id: string;
  node_name: string;
  payload: Record<string, unknown>;
};

export type DograhRunStatus = {
  id: number;
  workflow_id: number;
  name: string;
  mode: string;
  created_at: string;
  is_completed: boolean;
  transcript_url: string | null;
  recording_url: string | null;
  logs: {
    realtime_feedback_events?: RtfEvent[];
    telephony_status_callbacks?: Record<string, unknown>[];
  } | null;
  gathered_context: {
    provider?: string;
    call_id?: string;
    nodes_visited?: string[];
    call_disposition?: string;
  } | null;
};

export const dograh = {
  createWorkflow: (name: string, workflow_definition: unknown) =>
    request<DograhWorkflow>("/api/v1/workflow/create/definition", {
      method: "POST",
      body: JSON.stringify({ name, workflow_definition }),
    }),

  createDraft: (id: number) =>
    request<{ id: number; status: string }>(`/api/v1/workflow/${id}/create-draft`, { method: "POST" }),

  publishWorkflow: (id: number) =>
    request<DograhWorkflow>(`/api/v1/workflow/${id}/publish`, { method: "POST" }),

  updateWorkflow: (id: number, workflow_definition: unknown) =>
    request<DograhWorkflow>(`/api/v1/workflow/${id}`, {
      method: "PUT",
      body: JSON.stringify({ workflow_definition }),
    }),

  getWorkflow: (id: number) =>
    request<DograhWorkflow>(`/api/v1/workflow/fetch/${id}`),

  deleteWorkflow: (id: number) =>
    request<void>(`/api/v1/workflow/${id}`, { method: "DELETE" }),

  initiateCall: (workflowId: number, toPhoneNumber: string) =>
    request<Record<string, unknown>>("/api/v1/telephony/initiate-call", {
      method: "POST",
      body: JSON.stringify({ workflow_id: workflowId, phone_number: toPhoneNumber }),
    }),

  getLatestRun: (workflowId: number) =>
    request<{ runs: DograhRunStatus[] }>(`/api/v1/workflow/${workflowId}/runs?limit=1`),

  getRunStatus: (workflowId: number, runId: number) =>
    request<DograhRunStatus>(`/api/v1/workflow/${workflowId}/runs/${runId}`),
};
