export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

async function safeParseJson(text: string) {
  if (!text || text.trim().length === 0) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    const json = await safeParseJson(text);

    if (!res.ok) {
      const message =
        (json && (json.error || json.message)) ||
        (text && text.trim().slice(0, 200)) ||
        `HTTP ${res.status}`;
      return { ok: false, error: message, status: res.status };
    }

    return { ok: true, data: (json ?? (null as unknown as T)) };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Network error" };
  }
}