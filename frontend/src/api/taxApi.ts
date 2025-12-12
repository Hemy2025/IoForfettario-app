// frontend/src/api/taxApi.ts

export type HealthResponse = {
  status?: string;
  service?: string;
  ok?: boolean;
};

export type ComputeYearPayload = {
  profile: unknown; // lo tipizziamo dopo (per ora basta che passi il payload)
  yearInput: unknown;
};

export type AccantonamentoPayload = {
  profile: unknown;
  ctx: unknown;
  importoFattura: number;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${url} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

/**
 * Health check (proxy Vite -> backend)
 * Backend dovrebbe esporre GET /api/health
 */
export async function healthCheck(): Promise<HealthResponse> {
  // endpoint “standard” del nostro backend
  return await getJson<HealthResponse>("/api/health");
}

/**
 * Calcolo annuale: prova endpoint “nuovo” e fallback su endpoint “vecchio”
 * (così non si rompe se i nomi delle route cambiano tra branch/commit)
 */
export async function computeYear(payload: ComputeYearPayload): Promise<any> {
  try {
    return await postJson<any>("/api/tax/compute-year", payload);
  } catch {
    // fallback
    return await postJson<any>("/api/compute-year", payload);
  }
}

/**
 * Accantonamento per fattura: idem con fallback
 */
export async function computeAccantonamento(
  payload: AccantonamentoPayload
): Promise<any> {
  try {
    return await postJson<any>("/api/tax/accantonamento", payload);
  } catch {
    // fallback
    return await postJson<any>("/api/accantonamento", payload);
  }
}