import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { useThemeColors } from "../hooks/useThemeColors";
import { api, unwrap } from "../lib/api";

export default function LoginScreen() {
  const { login } = useAuth();
  const colors = useThemeColors();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = isRegistering ? "Register" : "Login";

  const handleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const data = unwrap(
        await api.api.v1.auth.login.post({
          username,
          password,
        }),
      );
      await login(data);
    } catch {
      setErrorMessage("Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const data = unwrap(
        await api.api.v1.auth.signup.post({
          username,
          password,
          real_name: realName,
          email,
        }),
      );
      await login(data);
    } catch {
      setErrorMessage("Registration failed. Username may already be taken.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (isRegistering) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-1 justify-center px-6"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-3xl font-bold text-center mb-8 dark:text-zinc-100">{title}</Text>

          <View className="gap-4">
            {isRegistering && (
              <>
                <TextInput
                  className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg px-4 py-3 text-base"
                  placeholder="Full Name"
                  placeholderTextColor={colors.placeholder}
                  value={realName}
                  onChangeText={setRealName}
                  autoCapitalize="words"
                />
                <TextInput
                  className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg px-4 py-3 text-base"
                  placeholder="Email"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </>
            )}

            <TextInput
              className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg px-4 py-3 text-base"
              placeholder="Username"
              placeholderTextColor={colors.placeholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg px-4 py-3 text-base"
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {errorMessage !== "" && (
              <Text className="text-red-500 text-center">{errorMessage}</Text>
            )}

            <TouchableOpacity
              className="bg-blue-500 rounded-lg py-3 items-center"
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  {isRegistering ? "Register" : "Login"}
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center justify-center mt-2">
              <Text className="text-gray-500 dark:text-zinc-400">
                {isRegistering ? "Already have an account?" : "Don't have an account?"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsRegistering(!isRegistering);
                  setErrorMessage("");
                }}
              >
                <Text className="text-blue-500 font-semibold ml-1">
                  {isRegistering ? "Login" : "Register"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
