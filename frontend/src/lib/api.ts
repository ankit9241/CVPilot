import { useLimitModalStore } from "@/store/limit-modal-store";

function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }
  // In production deployments (Netlify, Vercel, etc.), automatically fallback to deployed backend
  if (
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
  ) {
    return "https://cvpilot-emhy.onrender.com/api";
  }
  return "http://localhost:4000/api";
}

export const BASE_URL = resolveApiBaseUrl();

/** Thrown when the session can no longer be refreshed (expired/inactive/revoked). */
export class AuthExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "AuthExpiredError";
  }
}

// Called once when a refresh fails so auth state can be cleared + redirected.
let onAuthExpiredHandler: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

/** Single-flight refresh: concurrent 401s share one POST /auth/refresh. */
async function refreshSessionOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(storedRefreshToken ? { refreshToken: storedRefreshToken } : {}),
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json.data?.accessToken && typeof window !== "undefined") {
            localStorage.setItem("accessToken", json.data.accessToken);
            if (json.data.refreshToken) {
              localStorage.setItem("refreshToken", json.data.refreshToken);
            }
          }
          return true;
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, code = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface FeatureQuota {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

export interface UsageSummary {
  periodStart: string;
  periodEnd: string;
  features: {
    ATS_ANALYSIS: FeatureQuota;
    RESUME_GENERATION: FeatureQuota;
    AI_OPTIMIZATION: FeatureQuota;
    RESUME_IMPORT: FeatureQuota;
    AI_REWRITE: FeatureQuota;
    PDF_GENERATION: FeatureQuota;
  };
}

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${BASE_URL}${normalizedPath}`;
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    options.credentials = "include";
    options.headers = headers;

    try {
      const response = await fetch(url, options);

      if (response.status === 401) {
        // Never auto-retry the refresh call itself (prevents infinite loops).
        if (path.startsWith("/auth/refresh")) {
          throw new AuthExpiredError();
        }
        if (!retried) {
          const ok = await refreshSessionOnce();
          if (ok) {
            return this.request<T>(path, options, true);
          }
          // Refresh failed - session is genuinely expired.
          onAuthExpiredHandler?.();
          throw new AuthExpiredError();
        }
        throw new AuthExpiredError();
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const code = errorData?.error?.code || (response.status === 429 ? "RATE_LIMITED" : "API_ERROR");
        const message = errorData?.error?.message || `Request failed with status ${response.status}`;
        const details = errorData?.error?.details;

        if (code === "USAGE_LIMIT_REACHED") {
          useLimitModalStore.getState().openLimitModal({
            feature: details?.feature,
            message,
            used: details?.used,
            limit: details?.limit,
            remaining: details?.remaining,
            resetAt: details?.resetAt,
          });
        }

        throw new ApiError(message, response.status, code, details);
      }

      if (response.status === 204) {
        return null as unknown as T;
      }

      const resJson = await response.json();
      return resJson.data as T;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  set onAuthExpired(handler: (() => void) | null) {
    onAuthExpiredHandler = handler;
  }

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, data?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(path: string, data?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(path: string, data?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  async postStream<T>(
    path: string,
    data: unknown,
    onChunk: (event: T) => void,
    options: RequestInit = {}
  ): Promise<void> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${BASE_URL}${normalizedPath}`;
    const headers = new Headers(options.headers || {});
    if (!(data instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    options.credentials = "include";
    options.headers = headers;
    options.method = "POST";
    options.body = data instanceof FormData ? data : data ? JSON.stringify(data) : undefined;

    const response = await fetch(url, options);

    if (response.status === 401) {
      const ok = await refreshSessionOnce();
      if (ok) {
        return this.postStream<T>(path, data, onChunk, options);
      }
      onAuthExpiredHandler?.();
      throw new AuthExpiredError();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const code = errorData?.error?.code || (response.status === 429 ? "RATE_LIMITED" : "API_ERROR");
      const message = errorData?.error?.message || `Request failed with status ${response.status}`;
      const details = errorData?.error?.details;

      if (code === "USAGE_LIMIT_REACHED") {
        useLimitModalStore.getState().openLimitModal({
          feature: details?.feature,
          message,
          used: details?.used,
          limit: details?.limit,
          remaining: details?.remaining,
          resetAt: details?.resetAt,
        });
      }

      throw new ApiError(message, response.status, code, details);
    }

    if (!response.body) {
      throw new Error("No response body available for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as T;
          onChunk(parsed);
        } catch (err) {
          console.warn("Failed to parse stream chunk line:", trimmed, err);
        }
      }
    }

    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim()) as T;
        onChunk(parsed);
      } catch {
        // Ignore trailing partial line
      }
    }
  }
}

export const api = new ApiClient();
