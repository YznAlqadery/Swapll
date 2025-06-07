import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import WelcomingScreen from "@/components/WelcomingScreen";
import React from "react";
import { useRouter } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Text, View } from "react-native";

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
  const queryClient = new QueryClient();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InnerIndex />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
