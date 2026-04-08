import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../../hooks/useAuth";
import { useSettings } from "../../../hooks/useSettings";
import { useMe } from "../../../hooks/useMe";
import { useGyms } from "../../../hooks/useGyms";
import { useCurrentGym } from "../../../hooks/useCurrentGym";
import { useAllExerciseProfiles } from "../../../hooks/useExerciseProfiles";
import { api } from "../../../lib/api";
import { clearAllData } from "../../../services/storage";
import GymManagerModal from "../../../components/settings/GymManagerModal";

// Picker options
const REST_TIMER_OPTIONS = [30, 60, 90, 120, 180];
const MAX_DURATION_OPTIONS = [0, 60, 90, 120, 180, 240]; // 0 = disabled
const PRIVACY_OPTIONS = ["public", "friends", "private"] as const;
const UNIT_OPTIONS = [null, "kg", "lbs"] as const;

function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="mb-1 mt-5 px-4 text-xs font-semibold uppercase text-zinc-400">
      {children}
    </Text>
  );
}

function SettingsRow({
  children,
  onPress,
  last,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      className={`flex-row items-center justify-between bg-white px-4 py-3 ${
        last ? "" : "border-b border-zinc-100"
      } ${onPress ? "active:bg-zinc-50" : ""}`}
    >
      {children}
    </Wrapper>
  );
}

function PickerRow({
  label,
  value,
  options,
  onChange,
  last,
}: {
  label: string;
  value: string | number | null;
  options: { label: string; value: string | number | null }[];
  onChange: (value: any) => void;
  last?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const displayLabel =
    options.find((o) => o.value === value)?.label ?? String(value);

  return (
    <>
      <SettingsRow onPress={() => setShowPicker(true)} last={last}>
        <Text className="text-base">{label}</Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-base text-zinc-400">{displayLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
        </View>
      </SettingsRow>
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setShowPicker(false)}
        >
          <View className="mx-8 w-72 rounded-2xl bg-white p-2">
            <Text className="px-4 py-3 text-center text-lg font-semibold">
              {label}
            </Text>
            {options.map((opt) => (
              <Pressable
                key={String(opt.value)}
                onPress={() => {
                  onChange(opt.value);
                  setShowPicker(false);
                }}
                className="flex-row items-center justify-between rounded-lg px-4 py-3 active:bg-zinc-50"
              >
                <Text className="text-base">{opt.label}</Text>
                {opt.value === value && (
                  <Ionicons name="checkmark" size={20} color="#3b82f6" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { data: user, refetch: refetchUser } = useMe(isAuthenticated);
  const { gyms, addGym, updateGym, deleteGym } = useGyms();
  const { currentGymId, setCurrentGymId, refreshCurrentGym } = useCurrentGym();
  const { data: allProfiles } = useAllExerciseProfiles();

  const [showGymManager, setShowGymManager] = useState(false);

  // Username editing
  const [showEditUsername, setShowEditUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Email verification
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStep, setVerificationStep] = useState<
    "request" | "verify"
  >("request");
  const [isVerifying, setIsVerifying] = useState(false);

  // Password change
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordCode, setPasswordCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStep, setPasswordStep] = useState<"request" | "change">(
    "request",
  );
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const me = user as any;
  const profileCount = allProfiles
    ? Array.from(allProfiles.values()).reduce(
        (sum, profiles) => sum + profiles.length,
        0,
      )
    : 0;

  // Handlers
  const handleLogout = useCallback(async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        onPress: async () => {
          await clearAllData();
          logout();
        },
      },
    ]);
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.api.v1.users.me.delete();
              await clearAllData();
              logout();
            } catch {
              Alert.alert("Error", "Failed to delete account.");
            }
          },
        },
      ],
    );
  }, [logout]);

  const handleEditUsername = useCallback(() => {
    setNewUsername(me?.username ?? "");
    setShowEditUsername(true);
  }, [me?.username]);

  const handleSaveUsername = useCallback(async () => {
    if (!newUsername.trim()) return;
    setIsSaving(true);
    try {
      await api.api.v1.users.me.put({ username: newUsername.trim() });
      await refetchUser();
      setShowEditUsername(false);
    } catch {
      Alert.alert("Error", "Failed to update username.");
    } finally {
      setIsSaving(false);
    }
  }, [newUsername, refetchUser]);

  // Email verification handlers
  const handleOpenVerifyEmail = useCallback(() => {
    setVerificationCode("");
    setVerificationStep("request");
    setShowVerifyEmail(true);
  }, []);

  const handleRequestVerification = useCallback(async () => {
    setIsVerifying(true);
    try {
      const { error } = await api.api.v1.auth["send-verification"].post();
      if (error) throw error;
      setVerificationStep("verify");
      Alert.alert("Sent", "Verification code sent to your email.");
    } catch {
      Alert.alert("Error", "Failed to send verification code.");
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const handleVerifyEmail = useCallback(async () => {
    if (!verificationCode.trim()) return;
    setIsVerifying(true);
    try {
      const { error } = await api.api.v1.auth["verify-email"].post({
        code: verificationCode.trim(),
      });
      if (error) throw error;
      await refetchUser();
      setShowVerifyEmail(false);
      Alert.alert("Success", "Email verified successfully.");
    } catch {
      Alert.alert("Error", "Invalid or expired verification code.");
    } finally {
      setIsVerifying(false);
    }
  }, [verificationCode, refetchUser]);

  // Password change handlers
  const handleOpenChangePassword = useCallback(() => {
    setPasswordCode("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordStep("request");
    setShowChangePassword(true);
  }, []);

  const handleRequestPasswordChange = useCallback(async () => {
    setIsChangingPassword(true);
    try {
      const { error } =
        await api.api.v1.auth["request-password-change"].post();
      if (error) throw error;
      setPasswordStep("change");
      Alert.alert("Sent", "Verification code sent to your email.");
    } catch {
      Alert.alert(
        "Error",
        "Failed to send verification code. Please verify your email first.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!passwordCode.trim() || !newPassword || newPassword !== confirmPassword)
      return;
    setIsChangingPassword(true);
    try {
      const { error } = await api.api.v1.auth["change-password"].post({
        code: passwordCode.trim(),
        new_password: newPassword,
      });
      if (error) throw error;
      setShowChangePassword(false);
      Alert.alert("Success", "Password changed successfully.");
    } catch {
      Alert.alert("Error", "Invalid or expired verification code.");
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordCode, newPassword, confirmPassword]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="pb-12">
        {/* Header */}
        <View className="px-4 pb-2 pt-4">
          <Text className="text-3xl font-bold">Settings</Text>
        </View>

        {/* Profile Header */}
        {me && (
          <View className="items-center pb-4 pt-2">
            <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-blue-500">
              <Text className="text-xl font-bold text-white">
                {(me.real_name || me.username || "?")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </View>
            <Text className="text-lg font-semibold">
              {me.real_name || me.username}
            </Text>
            <Text className="text-sm text-zinc-400">@{me.username}</Text>
            {!me.email_verified && (
              <View className="mt-2 rounded-full bg-amber-100 px-3 py-1">
                <Text className="text-xs font-medium text-amber-600">
                  Email not verified
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Verify Email Banner */}
        {me && !me.email_verified && (
          <>
            <SectionHeader>Verification</SectionHeader>
            <View className="overflow-hidden rounded-xl mx-4">
              <SettingsRow onPress={handleOpenVerifyEmail} last>
                <View className="flex-row items-center gap-3">
                  <Ionicons name="mail" size={20} color="#f59e0b" />
                  <Text className="text-base font-medium text-amber-600">
                    Verify Email
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
              </SettingsRow>
            </View>
          </>
        )}

        {/* Display Section */}
        <SectionHeader>Display</SectionHeader>
        <View className="overflow-hidden rounded-xl mx-4">
          <PickerRow
            label="Weight Unit"
            value={settings.displayUnit}
            options={UNIT_OPTIONS.map((u) => ({
              label: u === null ? "Auto (locale)" : u === "kg" ? "Kilograms (kg)" : "Pounds (lbs)",
              value: u,
            }))}
            onChange={(v: "kg" | "lbs" | null) =>
              updateSettings({ displayUnit: v })
            }
          />
          <PickerRow
            label="Rest Timer"
            value={settings.defaultRestTimerSeconds}
            options={REST_TIMER_OPTIONS.map((s) => ({
              label: `${s} seconds`,
              value: s,
            }))}
            onChange={(v: number) =>
              updateSettings({ defaultRestTimerSeconds: v })
            }
          />
          <PickerRow
            label="Max Workout Duration"
            value={settings.maxWorkoutDurationMinutes}
            options={MAX_DURATION_OPTIONS.map((m) => ({
              label: m === 0 ? "Disabled" : `${m} minutes`,
              value: m,
            }))}
            onChange={(v: number) =>
              updateSettings({ maxWorkoutDurationMinutes: v })
            }
          />
          <PickerRow
            label="Default Privacy"
            value={settings.defaultPrivacy}
            options={PRIVACY_OPTIONS.map((p) => ({
              label: p.charAt(0).toUpperCase() + p.slice(1),
              value: p,
            }))}
            onChange={(v: string) => updateSettings({ defaultPrivacy: v })}
            last
          />
        </View>

        {/* Workout Behavior */}
        <SectionHeader>Workout Behavior</SectionHeader>
        <View className="overflow-hidden rounded-xl mx-4">
          <SettingsRow>
            <Text className="text-base">Auto Add Set</Text>
            <Switch
              value={settings.autoAddSet}
              onValueChange={(v) => updateSettings({ autoAddSet: v })}
            />
          </SettingsRow>
          <SettingsRow last>
            <Text className="text-base">Auto Remove Empty Set</Text>
            <Switch
              value={settings.autoRemoveEmptySet}
              onValueChange={(v) => updateSettings({ autoRemoveEmptySet: v })}
              disabled={!settings.autoAddSet}
            />
          </SettingsRow>
        </View>

        {/* Body */}
        <SectionHeader>Body</SectionHeader>
        <View className="overflow-hidden rounded-xl mx-4">
          <SettingsRow last>
            <Text className="text-base">
              Bodyweight ({settings.displayUnit ?? "kg"})
            </Text>
            <TextInput
              className="w-24 text-right text-base text-zinc-500"
              keyboardType="decimal-pad"
              placeholder="Not set"
              value={settings.bodyweight != null ? String(settings.bodyweight) : ""}
              onChangeText={(text) => {
                const val = text ? Number(text) : null;
                updateSettings({ bodyweight: val });
              }}
            />
          </SettingsRow>
        </View>

        {/* Privacy / Sharing */}
        <SectionHeader>Sharing</SectionHeader>
        <View className="overflow-hidden rounded-xl mx-4">
          <SettingsRow>
            <Text className="text-base">Share Gym Location</Text>
            <Switch
              value={settings.shareGymLocation}
              onValueChange={(v) => updateSettings({ shareGymLocation: v })}
            />
          </SettingsRow>
          <SettingsRow>
            <Text className="text-base">Show Online Status</Text>
            <Switch
              value={settings.shareOnlineStatus}
              onValueChange={(v) => updateSettings({ shareOnlineStatus: v })}
            />
          </SettingsRow>
          <SettingsRow>
            <Text className="text-base">Show Workout Status</Text>
            <Switch
              value={settings.shareWorkoutStatus}
              onValueChange={(v) => updateSettings({ shareWorkoutStatus: v })}
            />
          </SettingsRow>
          <SettingsRow last>
            <Text className="text-base">Share Workout History</Text>
            <Switch
              value={settings.shareWorkoutHistory}
              onValueChange={(v) => updateSettings({ shareWorkoutHistory: v })}
            />
          </SettingsRow>
        </View>

        {/* Gym Locations */}
        <SectionHeader>Gym Locations</SectionHeader>
        <View className="overflow-hidden rounded-xl mx-4">
          <PickerRow
            label="Current Gym"
            value={currentGymId}
            options={[
              { label: "None", value: null },
              ...gyms.map((g) => ({ label: g.name, value: g.id })),
            ]}
            onChange={(v: string | null) => setCurrentGymId(v)}
          />
          <SettingsRow onPress={() => setShowGymManager(true)} last>
            <View className="flex-row items-center gap-3">
              <Ionicons name="business" size={20} color="#3b82f6" />
              <Text className="text-base">Manage Gyms</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="min-w-[22px] items-center rounded-full bg-zinc-200 px-1.5 py-0.5">
                <Text className="text-xs font-semibold text-zinc-500">
                  {gyms.length}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
            </View>
          </SettingsRow>
        </View>

        {/* Exercise Profiles */}
        {allProfiles && allProfiles.size > 0 && (
          <>
            <SectionHeader>Exercise Profiles</SectionHeader>
            <View className="overflow-hidden rounded-xl mx-4">
              <SettingsRow
                onPress={() => router.push("/(tabs)/settings/exercise-profiles")}
                last
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="barbell" size={20} color="#3b82f6" />
                  <Text className="text-base">Manage Exercise Profiles</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="min-w-[22px] items-center rounded-full bg-zinc-200 px-1.5 py-0.5">
                    <Text className="text-xs font-semibold text-zinc-500">
                      {profileCount}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
                </View>
              </SettingsRow>
            </View>
          </>
        )}

        {/* Rep Range Colors */}
        <SectionHeader>Appearance</SectionHeader>
        <View className="overflow-hidden rounded-xl mx-4">
          <SettingsRow
            onPress={() => router.push("/(tabs)/settings/rep-ranges")}
            last
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="color-palette" size={20} color="#3b82f6" />
              <Text className="text-base">Rep Range Colors</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
          </SettingsRow>
        </View>

        {/* Profile / Account */}
        <SectionHeader>Account</SectionHeader>
        <View className="overflow-hidden rounded-xl mx-4">
          <SettingsRow onPress={handleEditUsername}>
            <View className="flex-row items-center gap-3">
              <Ionicons name="pencil" size={20} color="#3b82f6" />
              <Text className="text-base">Change Username</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
          </SettingsRow>
          <SettingsRow onPress={handleOpenChangePassword}>
            <View className="flex-row items-center gap-3">
              <Ionicons name="lock-closed" size={20} color="#3b82f6" />
              <Text className="text-base">Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
          </SettingsRow>
          <SettingsRow onPress={handleLogout}>
            <View className="flex-row items-center gap-3">
              <Ionicons name="log-out" size={20} color="#3b82f6" />
              <Text className="text-base text-blue-500">Log Out</Text>
            </View>
          </SettingsRow>
          <SettingsRow onPress={handleDeleteAccount} last>
            <View className="flex-row items-center gap-3">
              <Ionicons name="trash" size={20} color="#ef4444" />
              <Text className="text-base text-red-500">Delete Account</Text>
            </View>
          </SettingsRow>
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Gym Manager Modal */}
      <GymManagerModal
        visible={showGymManager}
        onDismiss={() => {
          setShowGymManager(false);
          refreshCurrentGym();
        }}
        gyms={gyms}
        onAddGym={addGym}
        onUpdateGym={updateGym}
        onDeleteGym={deleteGym}
      />

      {/* Edit Username Modal */}
      <Modal
        visible={showEditUsername}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditUsername(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white"
        >
          <View className="flex-row items-center justify-between border-b border-zinc-200 px-4 pb-3 pt-4">
            <Text className="text-xl font-bold">Change Username</Text>
            <Pressable
              onPress={() => setShowEditUsername(false)}
              className="active:opacity-60"
            >
              <Text className="text-base text-zinc-400">Cancel</Text>
            </Pressable>
          </View>
          <View className="p-4">
            <Text className="mb-2 text-sm font-medium text-zinc-500">
              New Username
            </Text>
            <TextInput
              className="rounded-lg bg-zinc-100 px-4 py-3 text-base"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <Pressable
              onPress={handleSaveUsername}
              disabled={isSaving || !newUsername.trim()}
              className={`mt-4 items-center rounded-lg py-3 ${
                isSaving || !newUsername.trim()
                  ? "bg-zinc-200"
                  : "bg-blue-500 active:bg-blue-600"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  isSaving || !newUsername.trim()
                    ? "text-zinc-400"
                    : "text-white"
                }`}
              >
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Verify Email Modal */}
      <Modal
        visible={showVerifyEmail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVerifyEmail(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white"
        >
          <View className="flex-row items-center justify-between border-b border-zinc-200 px-4 pb-3 pt-4">
            <Text className="text-xl font-bold">Verify Email</Text>
            <Pressable
              onPress={() => setShowVerifyEmail(false)}
              className="active:opacity-60"
            >
              <Text className="text-base text-zinc-400">Cancel</Text>
            </Pressable>
          </View>
          <View className="p-4">
            {verificationStep === "request" ? (
              <>
                <Text className="mb-4 text-base text-zinc-500">
                  We'll send a verification code to your email address.
                </Text>
                <Pressable
                  onPress={handleRequestVerification}
                  disabled={isVerifying}
                  className={`items-center rounded-lg py-3 ${
                    isVerifying
                      ? "bg-zinc-200"
                      : "bg-blue-500 active:bg-blue-600"
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isVerifying ? "text-zinc-400" : "text-white"
                    }`}
                  >
                    {isVerifying ? "Sending..." : "Send Verification Code"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text className="mb-2 text-sm font-medium text-zinc-500">
                  Verification Code
                </Text>
                <TextInput
                  className="rounded-lg bg-zinc-100 px-4 py-3 text-center text-xl tracking-widest"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <Pressable
                  onPress={handleVerifyEmail}
                  disabled={isVerifying || !verificationCode.trim()}
                  className={`mt-4 items-center rounded-lg py-3 ${
                    isVerifying || !verificationCode.trim()
                      ? "bg-zinc-200"
                      : "bg-blue-500 active:bg-blue-600"
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isVerifying || !verificationCode.trim()
                        ? "text-zinc-400"
                        : "text-white"
                    }`}
                  >
                    {isVerifying ? "Verifying..." : "Verify Email"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleRequestVerification}
                  disabled={isVerifying}
                  className="mt-3 items-center py-2"
                >
                  <Text className="text-sm text-blue-500">Resend Code</Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white"
        >
          <View className="flex-row items-center justify-between border-b border-zinc-200 px-4 pb-3 pt-4">
            <Text className="text-xl font-bold">Change Password</Text>
            <Pressable
              onPress={() => setShowChangePassword(false)}
              className="active:opacity-60"
            >
              <Text className="text-base text-zinc-400">Cancel</Text>
            </Pressable>
          </View>
          <View className="p-4">
            {passwordStep === "request" ? (
              <>
                <Text className="mb-4 text-base text-zinc-500">
                  We'll send a verification code to your email to confirm the
                  password change.
                </Text>
                <Pressable
                  onPress={handleRequestPasswordChange}
                  disabled={isChangingPassword}
                  className={`items-center rounded-lg py-3 ${
                    isChangingPassword
                      ? "bg-zinc-200"
                      : "bg-blue-500 active:bg-blue-600"
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isChangingPassword ? "text-zinc-400" : "text-white"
                    }`}
                  >
                    {isChangingPassword
                      ? "Sending..."
                      : "Send Verification Code"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text className="mb-2 text-sm font-medium text-zinc-500">
                  Verification Code
                </Text>
                <TextInput
                  className="mb-4 rounded-lg bg-zinc-100 px-4 py-3 text-center text-xl tracking-widest"
                  value={passwordCode}
                  onChangeText={setPasswordCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text className="mb-2 text-sm font-medium text-zinc-500">
                  New Password
                </Text>
                <TextInput
                  className="mb-4 rounded-lg bg-zinc-100 px-4 py-3 text-base"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <Text className="mb-2 text-sm font-medium text-zinc-500">
                  Confirm Password
                </Text>
                <TextInput
                  className="rounded-lg bg-zinc-100 px-4 py-3 text-base"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                {newPassword &&
                  confirmPassword &&
                  newPassword !== confirmPassword && (
                    <Text className="mt-2 text-sm text-red-500">
                      Passwords do not match
                    </Text>
                  )}
                <Pressable
                  onPress={handleChangePassword}
                  disabled={
                    isChangingPassword ||
                    !passwordCode.trim() ||
                    !newPassword ||
                    newPassword !== confirmPassword
                  }
                  className={`mt-4 items-center rounded-lg py-3 ${
                    isChangingPassword ||
                    !passwordCode.trim() ||
                    !newPassword ||
                    newPassword !== confirmPassword
                      ? "bg-zinc-200"
                      : "bg-blue-500 active:bg-blue-600"
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isChangingPassword ||
                      !passwordCode.trim() ||
                      !newPassword ||
                      newPassword !== confirmPassword
                        ? "text-zinc-400"
                        : "text-white"
                    }`}
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleRequestPasswordChange}
                  disabled={isChangingPassword}
                  className="mt-3 items-center py-2"
                >
                  <Text className="text-sm text-blue-500">Resend Code</Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
