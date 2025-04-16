import { View, Text } from "react-native";
import React from "react";
import { Link } from "expo-router";

const SkipButton = () => {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 30,
        right: 30,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Link href={`/(tabs)`}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "OpenSans_700Bold",
              color: "#008B8B",
              marginRight: 5,
            }}
          >
            Skip
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: "#008B8B",
            }}
          >
            →
          </Text>
        </View>
      </Link>
    </View>
  );
};

export default SkipButton;
