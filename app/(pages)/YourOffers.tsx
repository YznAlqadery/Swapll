import { useAuth } from "@/context/AuthContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

async function fetchOffers(userId: number, token: string) {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offers/user/${userId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch your offers");
  }

  return await response.json();
}

async function handleDelete(offerId: number, token: string) {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offer/${offerId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to delete offer");
  }
}

const YourOffers = () => {
  const { user: token } = useAuth();
  const { user } = useLoggedInUser();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isLoadingImages, setIsLoadingImages] = useState(false);
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
    enabled: !!user,
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (offerId: number) => handleDelete(offerId, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yourOffers"] });
    },
  });

  const fetchOfferImages = async (offers: Offer[], token: string) => {
    setIsLoadingImages(true);
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
      console.error("Error fetching images", error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  useEffect(() => {
    if (yourOffers && token) {
      fetchOfferImages(yourOffers, token);
    }
  }, [yourOffers, token]);

  const renderOffer = ({ item }: { item: Offer }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: "/(pages)/OfferDetails",
            params: {
              offerId: item.id,
            },
          });
        }}
      >
        <View style={styles.offerImageContainer}>
          <Image
            source={{ uri: offerImageMap.get(item.id) }}
            style={styles.offerImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.offerDetails}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.username}>by {item.username}</Text>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.priceButtonsRow}>
            <View style={styles.priceContainer}>
              <Image
                style={styles.coin}
                source={require("@/assets/images/swapll_coin.png")}
              />
              <Text style={styles.price}>{item.price}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.editButton}>
                <Feather name="edit" size={18} color="#fff" />
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  deleteOfferMutation.mutate(item.id as unknown as number)
                }
              >
                <FontAwesome5 name="trash-alt" size={16} color="#fff" />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#008B8B" />
          </TouchableOpacity>
          <Text style={styles.header}>Your Offers</Text>
        </View>
        {(yourOffersLoading || isLoadingImages) && (
          <>
            <SkeletonOfferItem />
            <SkeletonOfferItem />
            <SkeletonOfferItem />
          </>
        )}

        {yourOffersError && (
          <Text style={{ color: "red", textAlign: "center" }}>
            Failed to load your offers.
          </Text>
        )}

        <FlatList
          data={yourOffers}
          keyExtractor={(item) => item.id}
          renderItem={renderOffer}
          contentContainerStyle={styles.listContainer}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
    textAlign: "center",
    marginBottom: 24,
  },
  listContainer: {
    padding: 10,
  },
  offerImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
  },
  offerImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  offerDetails: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  card: {
    flexDirection: "column",
    marginVertical: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 2,
  },
  title: {
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  username: {
    color: "#666",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    marginBottom: 4,
  },
  description: {
    color: "#008B8B",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#E0FFFF",
    padding: 6,
    borderRadius: 8,
  },
  coin: {
    width: 25,
    height: 25,
    marginRight: 4,
    borderRadius: 50,
  },
  price: {
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
    gap: 10,
    marginLeft: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#20B2AA",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B22222",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 6,
  },
  backButton: {
    position: "absolute",
    top: 8,
    left: 10,
    zIndex: 1,
  },
  headerContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  priceButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 6,
  },
});

export default YourOffers;
