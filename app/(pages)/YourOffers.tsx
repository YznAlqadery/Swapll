import { useAuth } from "@/context/AuthContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Offer } from "../(tabs)";
import { downloadImageWithAuth } from "@/services/DownloadImageWithAuth";
import SkeletonOfferItem from "@/components/SkeletonItem";

async function fetchOffers(userId: number, token: string) {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offers/user/${userId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top rated offers");
  }

  const data = await response.json();
  return data;
}

const YourOffers = () => {
  const { user: token } = useAuth();
  const { user } = useLoggedInUser();

  const [isLoading, setIsLoading] = useState(false);
  const [offerImageMap, setOfferImageMap] = useState<Map<string, string>>(
    new Map()
  );
  const {
    data: yourOffers,
    isLoading: yourOffersLoading,
    error: yourOffersError,
  } = useQuery({
    queryKey: ["yourOffers"],
    queryFn: () => fetchOffers(user?.id as number, token as string),
    enabled: !!user, // prevents it from running before user is available
  });

  async function fetchOfferImages(offers: Offer[], token: string) {
    setIsLoading(true);
    try {
      const imageMap = new Map<string, string>();

      await Promise.all(
        offers.map(async (offer) => {
          const uri = await downloadImageWithAuth(
            offer.image,
            token,
            `offer-${offer.id}.jpg`
          );
          if (uri) imageMap.set(offer.id, uri);
        })
      );

      setOfferImageMap(imageMap);
    } catch (error) {
      console.error("Error fetching offer images:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (yourOffers && !isLoading) {
      fetchOfferImages(yourOffers, token as string);
    }
  }, [yourOffers, isLoading, token]);

  const renderOffer = ({ item }: { item: Offer }) => (
    <TouchableOpacity
      style={styles.offerItem}
      // onPress={() => handleSelectOffer(item)}
    >
      <View style={styles.offerImageContainer}>
        <Image
          source={{ uri: offerImageMap.get(item.id) }}
          style={styles.offerImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.offerDetails}>
        <Text
          style={{
            color: "#008B8B",
            fontFamily: "Poppins_700Bold",
            fontSize: 16,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            color: "#666",
            fontFamily: "Poppins_600SemiBold",
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          by {item.username}
        </Text>
        <Text
          style={{
            color: "#008B8B",
            fontFamily: "Poppins_400Regular",
            fontSize: 14,
          }}
        >
          {item.description}
        </Text>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
        >
          <Image
            style={{
              width: 25,
              height: 25,
              marginRight: 4,
              borderRadius: 50,
            }}
            source={require("@/assets/images/swapll_coin.png")}
          />
          <Text
            style={{
              color: "#008B8B",
              fontFamily: "Poppins_700Bold",
              fontSize: 15,
            }}
          >
            {item.price}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Your Offers</Text>
      {yourOffersLoading && (
        <>
          <SkeletonOfferItem />
          <SkeletonOfferItem />
          <SkeletonOfferItem />
        </>
      )}
      <FlatList
        data={yourOffers}
        keyExtractor={(item) => item.id}
        renderItem={renderOffer as any}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

export default YourOffers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#008B8B",
    padding: 10,
  },
  listContainer: {
    padding: 10,
  },

  offerText: {
    fontSize: 16,
    color: "#00796b",
  },
  offerItem: {
    width: 350,
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
    marginBottom: 16,
    alignSelf: "center",
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
