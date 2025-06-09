import { StyleSheet, View } from "react-native";

const SkeletonOfferItem = () => {
  return (
    <View style={[styles.offerItem, { opacity: 0.3 }]}>
      <View style={styles.offerImageContainer}>
        <View style={[styles.offerImage, { backgroundColor: "#ccc" }]} />
      </View>
      <View style={styles.offerDetails}>
        <View
          style={{
            width: "60%",
            height: 20,
            backgroundColor: "#ccc",
            marginBottom: 6,
            borderRadius: 4,
          }}
        />
        <View
          style={{
            width: "40%",
            height: 15,
            backgroundColor: "#ccc",
            marginBottom: 6,
            borderRadius: 4,
          }}
        />
        <View
          style={{
            width: "80%",
            height: 15,
            backgroundColor: "#ccc",
            marginBottom: 6,
            borderRadius: 4,
          }}
        />
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              backgroundColor: "#ccc",
              borderRadius: 9,
              marginRight: 4,
            }}
          />
          <View
            style={{
              width: 40,
              height: 15,
              backgroundColor: "#ccc",
              borderRadius: 4,
            }}
          />
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
  },

  offerDescription: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
  },

  offerImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
  },

  offerImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
  },
  offerDetails: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: 8,
  },
});

export default SkeletonOfferItem;
