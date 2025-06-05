import { AuthProvider } from "@/context/AuthContext";
import { Stack } from "expo-router";
import React from "react";

const PagesLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="EditProfile" options={{ headerShown: false }} />
    </Stack>
  );
};

export default PagesLayout;
