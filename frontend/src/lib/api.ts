const BASE_URL = "http://localhost:4000/api";

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
        throw new Error("Unauthorized");
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
}

export const api = new ApiClient();
