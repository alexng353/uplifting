import { View, Text } from "react-native";

interface FeedItem {
  workoutId: string;
  username: string;
  realName: string;
  workoutName: string | null;
  durationMinutes: number | null;
  totalVolume: string | null;
  totalSets: number | null;
  gymLocation: string | null;
  startTime: string;
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

function formatVolume(volume: string | null | undefined): string {
  if (!volume) return "";
  const num = Number(volume);
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(Math.round(num));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FeedCard({ item, unit }: FeedCardProps) {
  return (
    <View className="mx-4 mb-3 rounded-xl border border-zinc-200 bg-white p-4">
      {/* Header: avatar + name */}
      <View className="mb-3 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
          <Text className="text-sm font-bold text-white">
            {getInitials(item.realName)}
          </Text>
        </View>
        <View>
          <Text className="text-base font-semibold">{item.realName}</Text>
          <Text className="text-sm text-zinc-400">@{item.username}</Text>
        </View>
        <Text className="ml-auto text-xs text-zinc-400">
          {formatRelativeTime(item.startTime)}
        </Text>
      </View>

      {/* Workout name */}
      <Text className="mb-2 text-lg font-semibold">
        {item.workoutName || "Workout"}
      </Text>

      {/* Stats row */}
      <View className="mb-2 flex-row gap-4">
        {item.durationMinutes != null && item.durationMinutes > 0 && (
          <View className="rounded-md bg-zinc-100 px-2.5 py-1">
            <Text className="text-sm text-zinc-600">
              {formatDuration(item.durationMinutes)}
            </Text>
          </View>
        )}
        {item.totalVolume != null && Number(item.totalVolume) > 0 && (
          <View className="rounded-md bg-zinc-100 px-2.5 py-1">
            <Text className="text-sm text-zinc-600">
              {formatVolume(item.totalVolume)} {unit} vol
            </Text>
          </View>
        )}
        {item.totalSets != null && item.totalSets > 0 && (
          <View className="rounded-md bg-zinc-100 px-2.5 py-1">
            <Text className="text-sm text-zinc-600">
              {item.totalSets} sets
            </Text>
          </View>
        )}
      </View>

      {/* Gym location */}
      {item.gymLocation && (
        <Text className="text-sm text-zinc-400">
          {"\uD83D\uDCCD"} {item.gymLocation}
        </Text>
      )}
    </View>
  );
}
