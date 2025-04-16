import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import SelectOffer from "@/components/SelectOffer";
import { Link, useRouter } from "expo-router";
import SkipButton from "@/components/SkipButton";

const select = () => {
  const [selected, setSelected] = useState("");
  const router = useRouter();

  const handleSelect = (text: string) => {
    setSelected((prevSelected) => (prevSelected === text ? "" : text));
  };

  const handleNext = () => {
    router.push({
      pathname: `/(pages)/category`,
      params: {
        selected: selected,
      },
    });
  };
  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          backgroundColor: "#F0F7F7",
          marginHorizontal: 20,
          marginVertical: 10,
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            marginHorizontal: 20,
            marginVertical: 10,
            fontFamily: "OpenSans_700Bold",
            color: "#008B8B",
            textAlign: "center",
          }}
        >
          What are you looking for?
        </Text>
      </View>
      <View style={styles.offerContainer}>
        <SelectOffer
          text="Skills"
          handleSelect={handleSelect}
          selected={selected}
        />
        <SelectOffer
          text="Services"
          handleSelect={handleSelect}
          selected={selected}
        />
        <SelectOffer
          text="Items"
          handleSelect={handleSelect}
          selected={selected}
        />
      </View>
      {selected && (
        <TouchableOpacity
          style={{
            backgroundColor: "#008B8B",
            marginHorizontal: 20,
            marginVertical: 10,
            borderRadius: 10,
            padding: 10,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={handleNext}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: "OpenSans_700Bold",
              color: "#F0F7F7",
            }}
          >
            Next
          </Text>
        </TouchableOpacity>
      )}
      <SkipButton />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7",
    justifyContent: "center",
  },
  offerContainer: {
    flexDirection: "row",
    backgroundColor: "#F0F7F7",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default select;
