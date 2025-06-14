import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import WelcomingScreen from "@/components/WelcomingScreen";
import React from "react";
import { useRouter } from "expo-router";

import { Text, View } from "react-native";

import { LogBox } from "react-native";

// To ignore the specific warning:
LogBox.ignoreLogs([
  "Warning: Text strings must be rendered within a <Text> component.",
  "Warning: Encountered two children with the same key,",
]);

const InnerIndex = () => {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Clear AsyncStorage on mount without logout button
    const clearStorage = async () => {
      await AsyncStorage.clear();
      setUser(null); // Reset user in context too
    };
    clearStorage();
  }, []);

  useEffect(() => {
    console.log("User value in InnerIndex:", user);
    if (user) {
      router.replace("/(tabs)");
    } else {
      setCheckingAuth(false);
    }
  }, [user]);

  if (checkingAuth)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading authentication status...</Text>
      </View>
    );

  return <WelcomingScreen />;
};

export default function Index() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <InnerIndex />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
