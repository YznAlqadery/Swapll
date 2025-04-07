import { Text, TouchableOpacity } from "react-native";
import React from "react";

const AuthButtons = ({
  backgroundColor = "",
  title,
}: {
  backgroundColor: string;
  title: string;
}) => {
  return (
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
  );
};

export default AuthButtons;
