import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { View } from "react-native";
import { AuthProvider } from "@/context/AuthContext";
import React from "react";

const TabIcon = ({
  name,
  size,
  focused,
}: {
  name: string;
  size: number;
  focused: boolean;
}) => {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "#FFFFFF" : "transparent",
        marginTop: 8,
        width: 40,
        height: 40,
        borderRadius: 20,
        padding: 6,
      }}
    >
      <FontAwesome
        name={name}
        size={size}
        color={focused ? "#008B8B" : "#CCECEC"}
      />
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          backgroundColor: "#008B8B",
          borderRadius: 50,
          marginHorizontal: 20,
          marginBottom: 36,
          height: 53,
          position: "absolute",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#008B8B",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }: any) => (
            <TabIcon name="home" size={26} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }: any) => (
            <TabIcon name="envelope" size={24} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: ({ focused }: any) => (
            <TabIcon name="plus" size={28} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }: any) => (
            <TabIcon name="search" size={24} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }: any) => (
            <TabIcon name="user" size={26} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
