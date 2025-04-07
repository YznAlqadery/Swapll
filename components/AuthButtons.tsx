import { Text, TouchableOpacity } from "react-native";
import React from "react";
import { Link } from "expo-router";

const AuthButtons = ({
  backgroundColor = "",
  title,
  navigateTo,
}: {
  backgroundColor: string;
  title: string;
  navigateTo: string;
}) => {
  return (
    <Link href={navigateTo} asChild>
      <TouchableOpacity
        style={{
          backgroundColor: `${backgroundColor ? backgroundColor : ""}`,
          borderColor: "white",
          borderWidth: 2,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 30,
          minWidth: 140,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
          {title}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

export default AuthButtons;
