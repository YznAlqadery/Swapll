import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import React, { useRef, useEffect } from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type { Offer } from "@/app/(tabs)";
import { FontAwesome } from "@expo/vector-icons";

interface CustomBottomSheetProps {
  offer: Offer | null;
  open: boolean;
  onClose: () => void;
}

const CustomBottomSheet = ({
  offer,
  open,
  onClose,
}: CustomBottomSheetProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [open]);

  if (!offer) return null;

  return (
    <BottomSheet
      snapPoints={["90%"]}
      ref={bottomSheetRef}
      index={-1}
      enableDynamicSizing={true}
      enablePanDownToClose={true}
      onClose={onClose}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <BottomSheetView>
        <View
          style={{
            borderRadius: 16,
            margin: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Image
              source={{ uri: offer.image }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 12,
                marginBottom: 12,
                backgroundColor: "#eee",
              }}
              resizeMode="cover"
            />
          </View>
          <View style={styles.titleContainer}>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "OpenSans_700Bold",
                color: "#008B8B",
                marginBottom: 8,
              }}
            >
              {offer.title}
            </Text>
            <TouchableOpacity style={styles.chatButton}>
              <FontAwesome name="comment" size={18} color={"#F0F7F7"} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 15,
              fontFamily: "OpenSans_700Bold",
              color: "#666",
              marginBottom: 8,
              textDecorationLine: "underline",
            }}
          >
            {offer.owner}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "OpenSans_400Regular",
              color: "#333",
              marginBottom: 12,
            }}
          >
            {offer.description}
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginVertical: 8,
            }}
          >
            <View
              style={{
                backgroundColor: "#E8F5E9",
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "OpenSans_600SemiBold",
                  color: "#008B8B",
                }}
              >
                Price:{" "}
                <Text
                  style={{
                    color: "#333",
                  }}
                >
                  ${offer.price}
                </Text>
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#E8F5E9",
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "OpenSans_600SemiBold",
                  color: "#008B8B",
                }}
              >
                Delivery Time:{" "}
                <Text style={{ color: "#333" }}>{offer.deliveryTime}</Text>
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#E8F5E9",
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "OpenSans_600SemiBold",
                  color: "#008B8B",
                }}
              >
                Status:{" "}
                <Text style={{ color: "#333" }}>
                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                </Text>
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#E8F5E9",
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "OpenSans_600SemiBold",
                  color: "#008B8B",
                }}
              >
                Offer Type:{" "}
                <Text style={{ color: "#333" }}>
                  {offer.offerType.charAt(0).toUpperCase() +
                    offer.offerType.slice(1)}
                </Text>
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#E8F5E9",
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "OpenSans_600SemiBold",
                  color: "#008B8B",
                }}
              >
                Payment Method:{" "}
                <Text style={{ color: "#333" }}>
                  {offer.paymentMethod.charAt(0).toUpperCase() +
                    offer.paymentMethod.slice(1)}
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatButton: {
    backgroundColor: "#008B8B",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
});

export default CustomBottomSheet;
