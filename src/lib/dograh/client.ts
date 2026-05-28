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
    request<{ id: number }>("/api/v1/telephony/initiate-call", {
      method: "POST",
      body: JSON.stringify({ workflow_id: workflowId, phone_number: toPhoneNumber }),
    }),
};
