// What the app knows about its connection, kept outside React so any request can report to
// it. A failed request only raises suspicion: a health check decides, so a request cut off
// by leaving the page never shows anyone an outage.

export type Target = "backend" | "database";

export interface ConnectionState {
  offline: boolean;
  // A request has been running for a while, or the browser reports a slow link.
  slow: boolean;
  // A request has been running so long that it deserves more than a passing note.
  stalled: boolean;
  down: { since: number; targets: Target[] } | null;
  limitedUntil: number | null;
}

const SLOW_AFTER_MS = 10_000;
const STALLED_AFTER_MS = 45_000;
const PROBE_TIMEOUT_MS = 15_000;
const PROBE_EVERY_MS = 10_000;
const DEFAULT_LIMIT_SECONDS = 60;
const MAX_LIMIT_SECONDS = 120;
const GATEWAY_ERRORS = [502, 503, 504];

const SERVER_STATE: ConnectionState = { offline: false, slow: false, stalled: false, down: null, limitedUntil: null };

let state = SERVER_STATE;
let slowRequests = 0;
let stalledRequests = 0;
let slowLink = false;
let stallDismissed = false;
const suspects = new Set<Target>();
let probing = false;

const listeners = new Set<() => void>();

function publish(patch: Partial<ConnectionState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribeConnection(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const connectionSnapshot = () => state;
export const connectionServerSnapshot = () => SERVER_STATE;

function publishSpeed() {
  publish({ slow: slowLink || slowRequests > 0, stalled: stalledRequests > 0 && !stallDismissed });
}

export function dismissStall() {
  stallDismissed = true;
  publishSpeed();
}

export function dismissLimit() {
  publish({ limitedUntil: null });
}

export function setSlowLink(value: boolean) {
  slowLink = value;
  publishSpeed();
}

export function setOffline(value: boolean) {
  publish({ offline: value });
  if (!value) {
    window.dispatchEvent(new Event("serein:reconnected"));
    if (state.down) void probe();
  }
}

export function reportLimited(retryAfter: string | null) {
  const seconds = Number(retryAfter);
  const wait = Math.min(seconds > 0 ? seconds : DEFAULT_LIMIT_SECONDS, MAX_LIMIT_SECONDS);
  publish({ limitedUntil: Date.now() + wait * 1000 });
}

async function healthy(target: Target) {
  const signal = AbortSignal.timeout(PROBE_TIMEOUT_MS);
  try {
    const response =
      target === "backend"
        ? await fetch("/api/backend/health", { cache: "no-store", signal })
        : await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
            cache: "no-store",
            signal,
            headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
          });
    return response.ok;
  } catch {
    return false;
  }
}

async function probe() {
  if (probing) return;
  probing = true;
  while (suspects.size > 0) {
    const results = await Promise.all([...suspects].map(async (target) => [target, await healthy(target)] as const));
    for (const [target, ok] of results) if (ok) suspects.delete(target);

    if (suspects.size === 0) break;
    // Offline has its own screen, and says more than "the server is down" would.
    if (navigator.onLine) publish({ down: { since: state.down?.since ?? Date.now(), targets: [...suspects] } });
    await new Promise((resolve) => setTimeout(resolve, PROBE_EVERY_MS));
  }
  probing = false;
  if (state.down) {
    publish({ down: null });
    window.dispatchEvent(new Event("serein:reconnected"));
  }
}

export function retryNow() {
  // The loop may be mid-wait; a direct check answers straight away.
  void Promise.all([...suspects].map(async (target) => [target, await healthy(target)] as const)).then((results) => {
    for (const [target, ok] of results) if (ok) suspects.delete(target);
    if (suspects.size === 0 && state.down) {
      publish({ down: null });
      window.dispatchEvent(new Event("serein:reconnected"));
    }
  });
}

function suspect(target: Target) {
  suspects.add(target);
  void probe();
}

// Same as fetch, and tells this module how the request went.
export function trackedFetch(target: Target): typeof fetch {
  return async (input, init) => {
    let wasSlow = false;
    let wasStalled = false;
    const slowTimer = setTimeout(() => {
      wasSlow = true;
      slowRequests += 1;
      publishSpeed();
    }, SLOW_AFTER_MS);
    const stallTimer = setTimeout(() => {
      wasStalled = true;
      stalledRequests += 1;
      publishSpeed();
    }, STALLED_AFTER_MS);

    try {
      const response = await fetch(input, init);
      if (GATEWAY_ERRORS.includes(response.status)) suspect(target);
      return response;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) suspect(target);
      throw error;
    } finally {
      clearTimeout(slowTimer);
      clearTimeout(stallTimer);
      if (wasSlow) slowRequests -= 1;
      if (wasStalled) stalledRequests -= 1;
      if (stalledRequests === 0) stallDismissed = false;
      if (wasSlow || wasStalled) publishSpeed();
    }
  };
}
