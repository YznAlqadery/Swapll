import { Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";

const SelectOffer = ({
  text,
  handleSelect,
  selected,
}: {
  text: string;
  handleSelect: (text: string) => void;
  selected: string;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.offerBox,
        {
          borderWidth: selected === text ? 2 : 0,
          borderColor: selected === text ? "#008B8B" : "white",
        },
      ]}
      onPress={() => handleSelect(text)}
    >
      <Text style={styles.offerText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  offerBox: {
    backgroundColor: "white",
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 10,
    padding: 10,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  offerText: {
    fontSize: 18,
    fontFamily: "OpenSans_700Bold",
    color: "#008B8B",
    textAlign: "center",
  },
});

export default SelectOffer;
