import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "@/context/AuthContext";

import { useRouter } from "expo-router";

const OfferCard = ({
  title,
  price,
  image,
  id,
}: {
  title: string;
  price: number;
  image: string;
  id: number;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  if (isLoading)
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#008B8B" />
      </View>
    );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: "/(pages)/OfferDetails",
          params: {
            offerId: id,
          },
        });
      }}
    >
      {!image && (
        <Image
          source={require("@/assets/images/no_image.jpeg")}
          style={[
            styles.image,
            {
              width: "100%",
              height: 100,
            },
          ]}
        />
      )}
      {image && (
        <Image
          source={{ uri: image }}
          style={[
            styles.image,
            {
              width: "100%",
              height: 100,
            },
          ]}
        />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Image
          style={{
            width: 16,
            height: 16,
            marginRight: 4,
            marginTop: 4,
          }}
          source={require("@/assets/images/swapll_coin.png")}
        />
        <Text style={styles.price}>{price} </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 170,
    marginLeft: 12,
    backgroundColor: "#F0FDFD",
    borderRadius: 10,
    overflow: "hidden",
    padding: 8,
  },
  image: {
    width: "100%",
    borderRadius: 6,
    resizeMode: "cover",
  },
  title: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 8,
    color: "#333",
  },
  price: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#008B8B",
    marginTop: 4,
  },
});

export default OfferCard;
