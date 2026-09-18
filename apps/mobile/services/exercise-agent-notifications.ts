import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { requestPushToken } from "../lib/push-token-request";
import { getToken } from "./auth-storage";

const STORAGE_KEY = "exercise-agent-push-token";
let registration: Promise<boolean> | null = null;
let accountGeneration = 0;
let registrationWrite: Promise<unknown> | null = null;
let registrationController: AbortController | null = null;
let currentPushToken: string | null = null;

export function enableExerciseNotifications(): Promise<boolean> {
  if (registration) return registration;
  registration = register().finally(() => {
    registration = null;
  });
  return registration;
}

async function register(): Promise<boolean> {
  const generation = accountGeneration;
  if (Platform.OS === "web") return false;
  const auth = await getToken();
  if (!auth) return false;
  const notifications = await import("expo-notifications");
  if (generation !== accountGeneration) return false;
  if (Platform.OS === "android") {
    await notifications.setNotificationChannelAsync("exercise-agent", {
      name: "Exercise drafts",
      importance: notifications.AndroidImportance.DEFAULT,
    });
  }
  let permission = await notifications.getPermissionsAsync();
  if (generation !== accountGeneration) return false;
  if (!permission.granted) permission = await notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return false;
  const { data: token } = await notifications.getExpoPushTokenAsync({
    projectId,
  });
  // Permission/token acquisition can outlive the account that initiated it.
  const currentAuth = await getToken();
  if (generation !== accountGeneration || auth !== currentAuth) return false;
  currentPushToken = token;
  registrationController = new AbortController();
  registrationWrite = (async () => {
    await requestPushToken({
      method: "PUT",
      token,
      accessToken: auth,
      signal: registrationController!.signal,
    });
    if (generation === accountGeneration)
      await AsyncStorage.setItem(STORAGE_KEY, token).catch(() => {});
  })();
  try {
    await registrationWrite;
  } finally {
    registrationWrite = null;
    registrationController = null;
  }
  return true;
}

export async function unregisterExerciseNotifications() {
  // Invalidate pending permission dialogs without making logout wait on them.
  accountGeneration++;
  registrationController?.abort();
  await registrationWrite?.catch(() => {});
  try {
    const token = currentPushToken ?? (await AsyncStorage.getItem(STORAGE_KEY));
    const accessToken = await getToken();
    if (token && accessToken) await requestPushToken({ method: "DELETE", token, accessToken });
  } catch {
    // Cleanup is best effort: offline/storage failures must not prevent logout.
  } finally {
    currentPushToken = null;
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }
}

export function forgetExerciseNotifications() {
  accountGeneration++;
  registrationController?.abort();
  currentPushToken = null;
  void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}
