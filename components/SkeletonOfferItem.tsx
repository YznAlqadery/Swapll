import React from "react"; // Make sure to import React
import { StyleSheet, View } from "react-native";

const SkeletonOfferItem = () => {
  return (
    // Removed opacity: 0.3 here. If you want it dimmed, consider adding it to the placeholder background colors.
    <View style={styles.offerItem}>
      <View style={styles.offerImageContainer}>
        {/* Placeholder for the image */}
        <View style={styles.offerImagePlaceholder} />
      </View>
      <View style={styles.offerDetails}>
        {/* Placeholder for the main title text */}
        <View style={styles.textLineLarge} />
        {/* Placeholder for a subtitle/short description */}
        <View style={styles.textLineMedium} />
        {/* Placeholder for a longer description line */}
        <View style={styles.textLineLong} />
        {/* Placeholder for a row of icon and text */}
        <View style={styles.rowPlaceholder}>
          <View style={styles.iconPlaceholder} />
          <View style={styles.smallTextLine} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  offerItem: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "center", // Center the item
    marginVertical: 8, // Add margin for spacing
  },
  offerImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden", // Important for shimmer effect if applied
  },
  offerImagePlaceholder: {
    // Renamed from offerImage and added to StyleSheet
    width: "100%",
    height: 200,
    backgroundColor: "#e0e0e0", // Lighter gray for placeholder
    borderRadius: 12,
  },
  offerDetails: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  // New styles for text placeholders
  textLineLarge: {
    width: "60%",
    height: 20,
    backgroundColor: "#e0e0e0",
    marginBottom: 6,
    borderRadius: 4,
  },
  textLineMedium: {
    width: "40%",
    height: 15,
    backgroundColor: "#e0e0e0",
    marginBottom: 6,
    borderRadius: 4,
  },
  textLineLong: {
    width: "80%",
    height: 15,
    backgroundColor: "#e0e0e0",
    marginBottom: 6,
    borderRadius: 4,
  },
  rowPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  iconPlaceholder: {
    width: 18,
    height: 18,
    backgroundColor: "#e0e0e0",
    borderRadius: 9, // Half of width/height for a circle
    marginRight: 4,
  },
  smallTextLine: {
    width: 40,
    height: 15,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
});

// Use React.memo to prevent unnecessary re-renders
export default React.memo(SkeletonOfferItem);
