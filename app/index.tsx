import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import WelcomingScreen from "@/components/WelcomingScreen";
import React from "react";
import { useRouter } from "expo-router";

import { Text, View } from "react-native";

const InnerIndex = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

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
