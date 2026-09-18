import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useAuth } from "../hooks/useAuth";
import { notificationSessionId } from "../lib/exercise-agent";

export function ExerciseAgentNotifications() {
  const { isAuthenticated } = useAuth();
  const { data: user } = useCurrentUser();
  const router = useRouter();
  const client = useQueryClient();
  useEffect(() => {
    if (Platform.OS === "web" || !isAuthenticated || !user?.is_admin) return;
    let disposed = false;
    let clearHandler: (() => void) | undefined;
    const subscriptions: { remove(): void }[] = [];
    void import("expo-notifications")
      .then(async (notifications) => {
        if (disposed) return;
        notifications.setNotificationHandler({
          handleNotification: async (notification) => {
            const show = !disposed && !!notificationSessionId(notification.request.content.data);
            return {
              shouldShowBanner: show,
              shouldShowList: show,
              shouldPlaySound: false,
              shouldSetBadge: false,
            };
          },
        });
        clearHandler = () => notifications.setNotificationHandler(null);
        const open = (data: Record<string, unknown>) => {
          if (disposed) return;
          const id = notificationSessionId(data);
          if (id)
            router.push({
              pathname: "/(tabs)/settings/exercise-agent/[id]",
              params: { id },
            });
        };
        subscriptions.push(
          notifications.addNotificationResponseReceivedListener((response) => {
            open(response.notification.request.content.data);
            void notifications.clearLastNotificationResponseAsync();
          }),
        );
        subscriptions.push(
          notifications.addNotificationReceivedListener((notification) => {
            if (disposed || !notificationSessionId(notification.request.content.data)) return;
            client.invalidateQueries({ queryKey: ["exercise-agent", user.id] });
          }),
        );
        const response = await notifications.getLastNotificationResponseAsync();
        if (response && !disposed) {
          open(response.notification.request.content.data);
          await notifications.clearLastNotificationResponseAsync();
        }
      })
      .catch(() => {});
    return () => {
      disposed = true;
      clearHandler?.();
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [isAuthenticated, user?.id, user?.is_admin, router, client]);
  return null;
}
