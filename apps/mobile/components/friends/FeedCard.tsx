import { View, Text } from "react-native";

interface FeedItem {
  workout_id: string;
  username: string;
  real_name: string;
  workout_name: string | null;
  duration_minutes: number | null;
  total_volume: number | null;
  total_sets: number | null;
  gym_location: string | null;
  start_time: string;
}

interface FeedCardProps {
  item: FeedItem;
  unit: "kg" | "lbs";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function formatVolume(volume: number | null | undefined): string {
  if (!volume) return "";
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return String(Math.round(volume));
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FeedCard({ item, unit }: FeedCardProps) {
  return (
    <View className="mx-4 mb-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
      {/* Header: avatar + name */}
      <View className="mb-3 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
          <Text className="text-sm font-bold text-white">
            {getInitials(item.real_name)}
          </Text>
        </View>
        <View>
          <Text className="text-base font-semibold dark:text-zinc-100">{item.real_name}</Text>
          <Text className="text-sm text-zinc-400 dark:text-zinc-500">@{item.username}</Text>
        </View>
        <Text className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
          {formatRelativeTime(item.start_time)}
        </Text>
      </View>

      {/* Workout name */}
      <Text className="mb-2 text-lg font-semibold dark:text-zinc-100">
        {item.workout_name || "Workout"}
      </Text>

      {/* Stats row */}
      <View className="mb-2 flex-row gap-4">
        {item.duration_minutes != null && item.duration_minutes > 0 && (
          <View className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              {formatDuration(item.duration_minutes)}
            </Text>
          </View>
        )}
        {item.total_volume != null && item.total_volume > 0 && (
          <View className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              {formatVolume(item.total_volume)} {unit} vol
            </Text>
          </View>
        )}
        {item.total_sets != null && item.total_sets > 0 && (
          <View className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              {item.total_sets} sets
            </Text>
          </View>
        )}
      </View>

      {/* Gym location */}
      {item.gym_location && (
        <Text className="text-sm text-zinc-400 dark:text-zinc-500">
          {"\uD83D\uDCCD"} {item.gym_location}
        </Text>
      )}
    </View>
  );
}
