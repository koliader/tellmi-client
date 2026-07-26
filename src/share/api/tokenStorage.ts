import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import type { IPayload } from "../types/token";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const tokenStorage = {
  getAccessToken(): string | undefined {
    return Cookies.get(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken: string) {
    Cookies.set(ACCESS_TOKEN_KEY, accessToken, { path: "/" });
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { path: "/" });
  },

  clearTokens() {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
  },

  decodeToken(token: string): IPayload {
    return jwtDecode<IPayload>(token);
  },

  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    try {
      const payload = this.decodeToken(token);
      const exp =
        typeof payload.expired_at === "number"
          ? payload.expired_at
          : Math.floor(new Date(payload.expired_at).getTime() / 1000);
      return new Date(exp * 1000) <= new Date();
    } catch {
      return true;
    }
  },

  getPayload(): IPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      return this.decodeToken(token);
    } catch {
      return null;
    }
  },
};
