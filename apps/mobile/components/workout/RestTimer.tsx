import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { clearRest, getRest, subscribeRest } from "../../services/rest-timer";

// Ember, the redesign's action colour; also the Live Activity's rest countdown.
const REST_COLOR = "#F2894B";

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/** The automatic rest countdown while it runs; otherwise the manual stopwatch. */
export default function RestTimer() {
  const [rest, setRest] = useState(getRest);
  const [now, setNow] = useState(Date.now());
  useEffect(() => subscribeRest(setRest), []);
  useEffect(() => {
    if (!rest) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [rest]);

  if (rest && rest.endsAt > now) {
    return (
      <View testID="rest-countdown" className="flex-row items-center justify-center gap-3 py-2">
        <Text className="text-xs font-bold uppercase text-zinc-400">Rest</Text>
        <Text className="font-mono text-lg font-semibold" style={{ color: REST_COLOR }}>
          {formatTime(rest.endsAt - now + 999)}
        </Text>
        <Pressable
          onPress={clearRest}
          accessibilityLabel="Skip rest"
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: REST_COLOR }}
        >
          <Ionicons name="play-skip-forward" size={18} color="white" />
        </Pressable>
      </View>
    );
  }
  return <Stopwatch />;
}

function Stopwatch() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedMsRef = useRef(elapsedMs);

  // Keep ref in sync with state
  useEffect(() => {
    elapsedMsRef.current = elapsedMs;
  }, [elapsedMs]);

  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now() - elapsedMsRef.current;
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handlePress = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleLongPress = useCallback(() => {
    setIsRunning(false);
    setElapsedMs(0);
  }, []);

  return (
    <View className="flex-row items-center justify-center gap-3 py-2">
      <Text className="font-mono text-lg font-semibold text-zinc-700 dark:text-zinc-200">
        {formatTime(elapsedMs)}
      </Text>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        style={{ backgroundColor: isRunning ? "#f59e0b" : "#3b82f6" }}
      >
        <Ionicons name={isRunning ? "pause" : "play"} size={18} color="white" />
      </Pressable>
    </View>
  );
}
