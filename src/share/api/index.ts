import axios from "axios";
import { tokenStorage } from "./tokenStorage";

/** Port the Go gateway listens on in development. */
const GATEWAY_PORT = "8080";

/**
 * Resolves the gateway base URL.
 *
 * `NEXT_PUBLIC_API_URL` wins when set, which is what a deployed build should
 * do. Otherwise the host is taken from the page's own origin, so the app works
 * unchanged whether it is opened on `localhost`, on a LAN address from a
 * phone, or behind a tunnel — instead of the API calls being pointed at
 * whichever machine happens to be running the browser.
 */
const resolveApiUrl = (): string => {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) {
    return configured;
  }

  if (typeof window === "undefined") {
    return `http://localhost:${GATEWAY_PORT}`;
  }

  return `${window.location.protocol}//${window.location.hostname}:${GATEWAY_PORT}`;
};

const API_URL = resolveApiUrl();

/**
 * Absolute URL for a gateway-served path, for anything the browser loads
 * directly rather than through axios.
 *
 * Needed because an <img src> or a CSS url() cannot go through the axios
 * instance, so it does not get the base URL or the Authorization header applied
 * for it. Without this an avatar would be requested from the Next dev server,
 * which does not serve /avatars, and every picture would be a 404.
 *
 * Safe for unauthenticated paths only -- a token cannot be attached to a
 * subresource request, so anything requiring auth has to go through `api`.
 */
export const gatewayUrl = (path: string): string =>
  `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || "";
      const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        window.location.href = "/auth/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        tokenStorage.setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clearTokens();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
