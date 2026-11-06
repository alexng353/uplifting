export interface LiveActivityState {
  exercise: string;
  setLabel: string;
  detail: string;
  /** Epoch ms; both set while the automatic rest timer runs. */
  restStartedAt?: number;
  restEndsAt?: number;
}

export interface WorkoutSessionResult {
  saved: boolean;
  healthWorkoutId?: string;
  activeKcal?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
}

interface NativeModule {
  isLiveActivitySupported(): boolean;
  isWorkoutSessionSupported(): boolean;
  consumePendingIntent(): string | null;
  startOrUpdateActivity(
    workoutId: string,
    startMs: number,
    state: LiveActivityState,
  ): Promise<boolean>;
  endActivities(exceptWorkoutId: string | null): Promise<void>;
  startWorkoutSession(workoutId: string, startMs: number): Promise<boolean>;
  finishWorkoutSession(workoutId: string, endMs: number): Promise<WorkoutSessionResult>;
  discardWorkoutSession(): Promise<void>;
  addListener(event: "onIntent", cb: (e: { action: string }) => void): { remove(): void };
}

let cached: NativeModule | null | undefined;

/**
 * The native module, or null off iOS, in Expo Go and under bun tests. Loaded lazily so
 * importing this file never touches native code.
 */
export function upliftingLive(): NativeModule | null {
  if (cached !== undefined) return cached;
  cached = null;
  try {
    // Required here, not imported, so bun tests can load callers without react-native.
    const { Platform } = require("react-native");
    if (Platform.OS !== "ios") return cached;
    const { requireOptionalNativeModule } = require("expo-modules-core");
    cached = requireOptionalNativeModule("UpliftingLive") as NativeModule | null;
  } catch {
    cached = null;
  }
  return cached;
}
