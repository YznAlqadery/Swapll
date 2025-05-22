import React from "react";
import WelcomingScreen from "@/components/WelcomingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";

const index = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <WelcomingScreen />
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default index;
