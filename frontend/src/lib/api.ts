const BASE_URL = "http://localhost:4000/api";

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
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
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
          // Refresh failed — session is genuinely expired.
          onAuthExpiredHandler?.();
          throw new AuthExpiredError();
        }
        throw new AuthExpiredError();
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || `Request failed with status ${response.status}`,
        );
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
    const url = `${BASE_URL}${path}`;
    const headers = new Headers(options.headers || {});
    if (!(data instanceof FormData)) {
      headers.set("Content-Type", "application/json");
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
      throw new Error(
        errorData?.error?.message || `Request failed with status ${response.status}`
      );
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
