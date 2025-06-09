import { View, StyleSheet } from "react-native";
import React from "react";

const Divider = () => {
  return <View style={styles.divider} />;
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 10,
  },
});

export default Divider;
