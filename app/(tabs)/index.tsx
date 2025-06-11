import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import React, { useEffect, useState } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import CategoryFlatlist from "@/components/CategoryFlatlist";
import { downloadImageWithAuth } from "@/services/DownloadImageWithAuth";
import { useLoggedInUser } from "@/context/LoggedInUserContext";

import Divider from "@/components/Divider";
import { useRouter } from "expo-router";

export interface Offer {
  username: string;
  id: string;
  ownerId: number;
  title: string;
  image: string;
  description: string;
  price: number;
  deliveryTime: string;
  status: string;
  offerType: string;
  paymentMethod: string;
  categoryId: number;
}
type Category = {
  id: number;
  title: string;
};

const OfferItem = ({ item }: { item: Offer }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.offerItem}
      onPress={() => {
        router.push({
          pathname: "/(pages)/OfferDetails",
          params: { offerId: item.id },
        });
      }}
    >
      <View style={styles.offerImageContainer}>
        {item.image ? (
          item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.offerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.loadingImage}>
              <ActivityIndicator color="#008b8b" size="small" />
            </View>
          )
        ) : (
          <Image
            source={require("@/assets/images/no_image.jpeg")}
            style={styles.offerImage}
            resizeMode="cover"
          />
        )}
      </View>
      <View style={styles.offerDetails}>
        <Text style={styles.offerTitle}>{item.title}</Text>
        <Text style={styles.offerUsername}>by {item.username}</Text>
        <Text style={styles.offerDescription}>{item.description}</Text>
        <View style={styles.priceRow}>
          <Image
            style={styles.coinImage}
            source={require("@/assets/images/swapll_coin.png")}
          />
          <Text style={styles.priceText}>{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const fetchCategories = async (userToken: string) => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/categories`,
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
};

export const fetchTopRatedOffers = async (userToken: string) => {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offers/top-rated`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch top rated offers");
  return response.json();
};

export const fetchRecentOffers = async (userToken: string) => {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offers/recent`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch recent offers");
  return response.json();
};

export const fetchOffersByCategory = async (
  userToken: string,
  categoryId: number
) => {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offers/category/${categoryId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch offers by category");
  return response.json();
};

const Index = () => {
  const { user: token } = useAuth();
  const { user, setUser } = useLoggedInUser();
  const [categoryId, setCategoryId] = useState<number | null>(0);
  const [category, setCategory] = useState("");

  const queryClient = useQueryClient();

  const categories = queryClient.getQueryData<Category[]>(["categories"]);
  const topRatedOffers = queryClient.getQueryData<Offer[]>([
    "top-rated-offers",
  ]);
  const recentOffers = queryClient.getQueryData<Offer[]>(["recent-offers"]);

  const {
    data: offersByCategory,
    isLoading: offersByCategoryLoading,
    error: offersByCategoryError,
  } = useQuery({
    queryKey: ["offers-by-category", categoryId],
    queryFn: () => fetchOffersByCategory(token || "", categoryId || 0),
    enabled: !!user && !!categoryId,
  });

  useEffect(() => {
    async function fetchUser() {
      if (!token) return;
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/user/myinfo`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Failed fetching user info:", error);
      }
    }

    fetchUser();
  }, [token]);

  if (!user) {
    return (
      <SafeAreaView>
        <ActivityIndicator size="large" color="#008B8B" />
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <FlatList
          data={[]}
          renderItem={null}
          ListEmptyComponent={null}
          ListHeaderComponent={
            <View>
              <View style={styles.headerRow}>
                <Image
                  source={require("@/assets/images/swapll_home.png")}
                  style={styles.logo}
                />
                <View style={styles.balanceBox}>
                  <Image
                    style={styles.coinImage}
                    source={require("@/assets/images/swapll_coin.png")}
                  />
                  <Text style={styles.balanceText}>{user?.balance}</Text>
                </View>
              </View>

              <Divider />

              <Text style={styles.header}>Popular Categories</Text>
              <View style={{ height: 70 }}>
                <CategoryFlatlist
                  data={categories as Category[]}
                  selectedCategoryId={categoryId}
                  setSelectedCategoryId={setCategoryId}
                  setCategory={setCategory}
                />
              </View>

              <Divider />

              {!offersByCategoryLoading && (
                <>
                  {!offersByCategoryError ? (
                    <Text style={styles.header}>Offers in {category}</Text>
                  ) : (
                    <Text style={styles.header}>Our Community's Favorites</Text>
                  )}
                  {categoryId && offersByCategory?.length! > 0 && (
                    <FlatList
                      data={offersByCategory.filter(
                        (offer: Offer) => offer.ownerId !== user?.id
                      )}
                      renderItem={({ item }) => <OfferItem item={item} />}
                      keyExtractor={(item) => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    />
                  )}

                  {!categoryId && topRatedOffers?.length! > 0 && (
                    <>
                      <FlatList
                        data={topRatedOffers?.filter(
                          (offer) => offer.ownerId !== user?.id
                        )}
                        renderItem={({ item }) => <OfferItem item={item} />}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      />
                    </>
                  )}

                  <Divider />

                  {!categoryId && recentOffers?.length! > 0 && (
                    <>
                      <Text style={styles.header}>Latest Deals for You</Text>
                      <FlatList
                        data={recentOffers?.filter(
                          (offer) => offer.ownerId !== user?.id
                        )}
                        renderItem={({ item }) => <OfferItem item={item} />}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 60 }}
                      />
                    </>
                  )}
                </>
              )}
            </View>
          }
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7",
  },
  header: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginHorizontal: 16,
    color: "#008B8B",
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  logo: {
    width: 120,
    height: 50,
    resizeMode: "contain",
    marginLeft: 20,
  },
  balanceBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#008B8B",
    padding: 5,
    borderRadius: 10,
  },
  coinImage: {
    width: 25,
    height: 25,
    marginRight: 4,
    borderRadius: 50,
  },
  balanceText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 5,
    fontFamily: "Poppins_700Bold",
    paddingHorizontal: 6,
  },
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
  offerImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
  },
  offerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  loadingImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  offerDetails: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  offerTitle: {
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  offerUsername: {
    color: "#666",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    marginBottom: 4,
  },
  offerDescription: {
    color: "#008B8B",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  priceText: {
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
});

export default Index;
