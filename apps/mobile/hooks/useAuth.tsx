import { useQueryClient } from "@tanstack/react-query";
import {
  forgetExerciseNotifications,
  unregisterExerciseNotifications,
} from "../services/exercise-agent-notifications";
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
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then((token) => {
      setIsAuthenticated(!!token);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(
    async (tokens: { access_token: string; refresh_token: string }) => {
      await unregisterExerciseNotifications();
      queryClient.clear();
      await setRefreshToken(tokens.refresh_token);
      await setToken(tokens.access_token);
      resetUnauthorizedGuard();
      setIsAuthenticated(true);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await unregisterExerciseNotifications();
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      // best-effort server revoke; ignore failures
      try {
        await api.api.v1.auth.logout.post({ refresh_token: refreshToken });
      } catch {}
    }
    await clearAllTokens();
    clearAllData();
    queryClient.clear();
    setIsAuthenticated(false);
  }, [queryClient]);

  useEffect(() => {
    setOnUnauthorized(() => {
      Alert.alert("Session expired", "Please sign in again.");
      forgetExerciseNotifications();
      // local-only teardown — server token is already invalid
      clearAllTokens().then(() => {
        clearAllData();
        queryClient.clear();
        setIsAuthenticated(false);
      });
    });
    return () => setOnUnauthorized(null);
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
