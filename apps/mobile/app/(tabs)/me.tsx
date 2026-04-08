import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">Me</Text>
      </View>
    </SafeAreaView>
  );
}
