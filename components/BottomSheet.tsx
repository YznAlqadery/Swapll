import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { Offer } from "@/app/(tabs)";

const CustomBottomSheet = ({
  offer,
  open,
  onClose,
}: {
  offer: Offer | null;
  open: boolean;
  onClose: any;
}) => {
  const snapPoints = useMemo(() => ["50%"], []);

  return (
    <BottomSheet
      index={open ? 0 : -1}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{offer?.title}</Text>
        <Text style={styles.description}>{offer?.description}</Text>
        {/* Add other offer info here */}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#008B8B",
  },
  description: {
    fontSize: 14,
    marginTop: 8,
  },
});

export default CustomBottomSheet;
