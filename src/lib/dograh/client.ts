// Dograh REST API client
// Base URL comes from DOGRAH_API_URL env var (exposed via Cloudflare Tunnel)

const base = process.env.DOGRAH_API_URL ?? "http://localhost:8000";
const key = process.env.DOGRAH_API_KEY ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Dograh API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const dograh = {
  createWorkflow: (body: unknown) =>
    request("/api/v1/workflows", { method: "POST", body: JSON.stringify(body) }),

  updateWorkflow: (id: string, body: unknown) =>
    request(`/api/v1/workflows/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  getWorkflow: (id: string) => request(`/api/v1/workflows/${id}`),

  deleteWorkflow: (id: string) =>
    request(`/api/v1/workflows/${id}`, { method: "DELETE" }),
};
