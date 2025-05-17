import { Stack } from "expo-router";
import React from "react";

const PagesLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="select"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="category"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="continueSignUp"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
};

export default PagesLayout;
