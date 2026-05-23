import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Alert } from "react-native";
import {
  clearAllTokens,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "../services/auth-storage";
import { clearAllData } from "../services/storage";
import { api, resetUnauthorizedGuard, setOnUnauthorized } from "../lib/api";

interface AuthContext {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { access_token: string; refresh_token: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then((token) => {
      setIsAuthenticated(!!token);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (tokens: { access_token: string; refresh_token: string }) => {
    await setRefreshToken(tokens.refresh_token);
    await setToken(tokens.access_token);
    resetUnauthorizedGuard();
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      // best-effort server revoke; ignore failures
      try {
        await api.api.v1.auth.logout.post({ refresh_token: refreshToken });
      } catch {}
    }
    await clearAllTokens();
    clearAllData();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      Alert.alert("Session expired", "Please sign in again.");
      // local-only teardown — server token is already invalid
      clearAllTokens().then(() => {
        clearAllData();
        setIsAuthenticated(false);
      });
    });
    return () => setOnUnauthorized(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
