import { reportLimited, trackedFetch } from "./connection";
import { supabaseBrowser } from "./supabase/client";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly data: Record<string, unknown>,
  ) {
    super(message);
  }
  get code() {
    return this.data.code as string | undefined;
  }
}

const backendFetch = trackedFetch("backend");

// Calls the Express backend through this origin, so the gate pass cookie is first-party.
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const {
    data: { session },
  } = await supabaseBrowser().auth.getSession();

  let response: Response;
  try {
    response = await backendFetch(`/api/backend${path}`, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      credentials: "same-origin",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "We could not reach the server. Try again in a moment.", {});
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // A code means the screen handles it, such as the security question's own cooldown.
    if (response.status === 429 && !data.code) reportLimited(response.headers.get("retry-after"));
    // A sleeping free-tier backend answers the proxy with a gateway error while it wakes.
    const message = response.status >= 502 ? "The server is waking up. Try again in a moment." : data.error;
    throw new ApiError(response.status, message ?? "Something went wrong.", data);
  }
  return data as T;
}

export async function signOut() {
  await api("/gate/lock", { method: "POST" }).catch(() => {});
  await supabaseBrowser().auth.signOut();
  window.location.assign("/");
}

export async function lockNow() {
  await api("/gate/lock", { method: "POST" }).catch(() => {});
  window.location.assign("/gate");
}
