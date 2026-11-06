import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useRouter } from "expo-router";
import { requestFinish } from "../lib/intent-bus";
import { upliftingLive } from "../modules/uplifting-live";
import { useWorkout } from "./useWorkout";

/** Handles the Start / Finish Workout App Intents (Siri, Shortcuts, Action button). */
export function useWorkoutIntents(): void {
  const router = useRouter();
  const { isActive, startWorkout } = useWorkout();
  // The listeners below live for the app's lifetime; read the latest values through refs.
  const latest = useRef({ isActive, startWorkout, router });
  latest.current = { isActive, startWorkout, router };

  useEffect(() => {
    const live = upliftingLive();
    if (!live) return;
    const handle = (action: string | null) => {
      if (!action) return;
      const { isActive, startWorkout, router } = latest.current;
      if (action === "start" && !isActive) startWorkout();
      if (action === "finish" && isActive) requestFinish();
      router.navigate("/workout");
    };
    handle(live.consumePendingIntent());
    // The event only says "look"; consuming clears the copy kept for cold launches.
    const sub = live.addListener("onIntent", () => handle(live.consumePendingIntent()));
    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") handle(live.consumePendingIntent());
    });
    return () => {
      sub.remove();
      appSub.remove();
    };
  }, []);
}
