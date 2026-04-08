import { treaty } from "@elysiajs/eden";
import type { App } from "../../api/src/index";
import { getToken } from "../services/auth-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

export const api = treaty<App>(API_URL, {
  headers: async () => {
    const token = await getToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  },
});
