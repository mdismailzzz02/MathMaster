import { supabase } from "./supabase";
import { EDGE_FUNCTION_URL } from "./config";

export async function callEdgeFunction<T = unknown>(
  name: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string>;
    /** Set false for public endpoints called before sign-in (e.g. signup). Default true. */
    authenticated?: boolean;
  } = {}
): Promise<{ data: T | null; error: string | null }> {
  const authenticated = options.authenticated ?? true;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (authenticated && !session) {
    return { data: null, error: "Not authenticated" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const url = new URL(EDGE_FUNCTION_URL(name));
  if (options.query) {
    Object.entries(options.query).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  try {
    const res = await fetch(url.toString(), {
      method: options.method ?? "POST",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const parsed = text ? JSON.parse(text) : null;
        if (parsed?.error) message = parsed.error;
      } catch {
        if (text) message = text;
      }
      return { data: null, error: message };
    }
    return { data: text ? JSON.parse(text) : null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Network error" };
  }
}