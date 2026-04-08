import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RepRangesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">Rep Ranges</Text>
      </View>
    </SafeAreaView>
  );
}
