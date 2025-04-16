import React from "react";
import WelcomingScreen from "@/components/WelcomingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const index = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WelcomingScreen />
    </GestureHandlerRootView>
  );
};

export default index;
