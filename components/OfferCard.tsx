import React, { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { downloadImageWithAuth } from "@/services/DownloadImageWithAuth";

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
  const { user: token } = useAuth();
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      const uri = await downloadImageWithAuth(
        image,
        token as string,
        `offer-${id}.jpg`
      );
      if (uri) {
        setLocalImageUri(uri);
        Image.getSize(uri, (w, h) => setAspectRatio(w / h));
      }
      setIsLoading(false);
    };

    loadImage();
  }, [image, token]);

  return (
    <View style={styles.card}>
      {isLoading || !localImageUri ? (
        <ActivityIndicator size="small" />
      ) : (
        <Image
          source={{ uri: localImageUri }}
          style={[
            styles.image,
            aspectRatio !== null ? { aspectRatio } : { height: 100 }, // fallback height while loading aspectRatio
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
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 170,
    marginLeft: 12,
    backgroundColor: "#E0F7F7",
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
