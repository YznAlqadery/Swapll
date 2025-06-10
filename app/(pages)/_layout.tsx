import { AuthProvider } from "@/context/AuthContext";
import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";

const PagesLayout = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack>
        <Stack.Screen name="EditProfile" options={{ headerShown: false }} />
        <Stack.Screen name="ChatPage" options={{ headerShown: false }} />
        <Stack.Screen name="YourOffers" options={{ headerShown: false }} />
        <Stack.Screen name="OfferDetails" options={{ headerShown: false }} />
        <Stack.Screen name="EditOffer" options={{ headerShown: false }} />
        <Stack.Screen name="UserProfile" options={{ headerShown: false }} />
        <Stack.Screen name="AddReview" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default PagesLayout;
