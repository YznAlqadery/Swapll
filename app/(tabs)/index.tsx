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
import CustomBottomSheet from "@/components/BottomSheet";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import CategoryFlatlist from "@/components/CategoryFlatlist";
import { downloadImageWithAuth } from "@/services/DownloadImageWithAuth";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import SkeletonOfferItem from "@/components/SkeletonItem";

export interface Offer {
  username: string;
  firstName: string;
  lastName: string;
  id: string;
  owner: string;
  title: string;
  image: string;
  description: string;
  price: number;
  deliveryTime: string;
  status: string;
  offerType: string;
  paymentMethod: string;
}
type Category = {
  id: number;
  title: string;
};

const OfferItem = ({
  item,
  selectedOffer,
  handleSelectOffer,
  offerImageMap,
}: {
  item: Offer;
  selectedOffer: Offer;
  handleSelectOffer: (item: Offer) => void;
  offerImageMap: Map<string, string>;
}) => {
  return (
    <TouchableOpacity
      style={styles.offerItem}
      onPress={() => handleSelectOffer(item)}
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
};

const fetchCategories = async (userToken: string) => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/categories`,
    {
      headers: { Authorization: `Bearer ${userToken}` },
    }
  );
  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error("Failed to fetch categories");
  }
};
const fetchTopRatedOffers = async (userToken: string) => {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offers/top-rated`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top rated offers");
  }

  const data = await response.json();
  return data;
};

const fetchRecentOffers = async (userToken: string) => {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offers/recent`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top rated offers");
  }

  const data = await response.json();
  return data;
};

const fetchOffersByCategory = async (userToken: string, categoryId: number) => {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offers/category/${categoryId}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top rated offers");
  }

  const data = await response.json();
  return data;
};

const Index = () => {
  const { user: token } = useAuth();
  const { user, setUser } = useLoggedInUser();
  const [categoryId, setCategoryId] = useState<number | null>(0);
  const [category, setCategory] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const {
    data,
    isLoading: dataIsLoading,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(token || ""),
  });

  const {
    data: topRatedOffers,
    isLoading: topRatedOffersIsLoading,
    error: topRatedOffersError,
  } = useQuery({
    queryKey: ["top-rated-offers", categoryId],
    queryFn: () => fetchTopRatedOffers(token || ""),
    enabled: !!user, // prevents it from running before user is available
  });

  const {
    data: recentOffers,
    isLoading: recentOffersLoading,
    error: recentOffersError,
  } = useQuery({
    queryKey: ["recent-offers"],
    queryFn: () => fetchRecentOffers(token || ""),
    enabled: !!user, // prevents it from running before user is available
  });

  const {
    data: offersByCategory,
    isLoading: offersByCategoryLoading,
    error: offersByCategoryError,
  } = useQuery({
    queryKey: ["offers-by-category", categoryId],
    queryFn: () => fetchOffersByCategory(token || "", categoryId || 0),
    enabled: !!user && !!categoryId, // prevents it from running before user and categoryId are available
  });

  const categories = data as Category[];

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [offerImageMap, setOfferImageMap] = useState<Map<string, string>>(
    new Map()
  );

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
    if (topRatedOffers && user) {
      fetchOfferImages(topRatedOffers, token || "");
    }
  }, [topRatedOffers, user]);

  useEffect(() => {
    if (recentOffers && user) {
      fetchOfferImages(recentOffers, token || "");
    }
  }, [recentOffers, user]);

  useEffect(() => {
    if (offersByCategory && user) {
      fetchOfferImages(offersByCategory, token || "");
    }
  }, [offersByCategory, user]);

  const handleSelectOffer = (offer: Offer) => {
    if (selectedOffer?.id === offer.id && sheetOpen) {
      setSheetOpen(false);
      setTimeout(() => {
        setSelectedOffer(offer);
        setSheetOpen(true);
      }, 300); // Wait for the sheet to close before reopening
    } else {
      setSelectedOffer(offer);
      setSheetOpen(true);
    }
  };

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
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: "#fff",
      }}
    >
      <StatusBar barStyle={"dark-content"} />
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 40,
              padding: 10,
            }}
          >
            <Image
              source={require("@/assets/images/swapll_home.png")}
              style={{
                width: 120,
                height: 50,
                objectFit: "contain",
                marginTop: 10,
                marginLeft: 20,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
                marginTop: 10,
                backgroundColor: "#008B8B",
                paddingVertical: 5,
                paddingHorizontal: 14,
                borderRadius: 10,
              }}
            >
              <Image
                style={{
                  width: 30,
                  height: 30,
                }}
                source={require("@/assets/images/swapll_coin.png")}
              />
              <Text
                style={{
                  fontSize: 16,
                  marginLeft: 5,
                  color: "#fff",
                  fontFamily: "Poppins_700Bold",
                }}
              >
                {user?.balance}
              </Text>
            </View>
          </View>

          <Text style={styles.header}>Popular Categories</Text>

          <View
            style={{
              height: 70,
            }}
          >
            <CategoryFlatlist
              data={categories}
              selectedCategoryId={categoryId}
              setSelectedCategoryId={setCategoryId}
              setCategory={setCategory}
            />
          </View>

          <View
            style={{
              flex: 1,
              marginVertical: 20,
              paddingBottom: 40,
            }}
          >
            {category ? (
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Poppins_700Bold",
                  marginBottom: 10,
                  color: "#008B8B",
                  marginLeft: 20,
                }}
              >
                Offers in {category}
              </Text>
            ) : (
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Poppins_700Bold",
                  marginBottom: 10,
                  color: "#008B8B",
                  marginLeft: 20,
                  marginTop: 40,
                }}
              >
                Our Community's Favorites
              </Text>
            )}
            {topRatedOffersIsLoading || isLoading ? (
              <>
                <SkeletonOfferItem />
                <SkeletonOfferItem />
                <SkeletonOfferItem />
              </>
            ) : (
              topRatedOffersError && (
                <Text
                  style={{
                    textAlign: "center",
                    marginTop: 20,
                    fontFamily: "Poppins_700Bold",
                  }}
                >
                  No offers found in this category.
                </Text>
              )
            )}
            {!categoryId && (
              <FlatList
                data={topRatedOffers}
                renderItem={({ item }) => (
                  <OfferItem
                    item={item}
                    selectedOffer={selectedOffer || ({} as Offer)}
                    handleSelectOffer={handleSelectOffer}
                    offerImageMap={offerImageMap}
                  />
                )}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                horizontal={true}
              />
            )}

            {!categoryId && (
              <View>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "Poppins_700Bold",
                    marginBottom: 10,
                    color: "#008B8B",
                    marginLeft: 20,
                    marginTop: 40,
                  }}
                >
                  Latest Deals for You
                </Text>
                <FlatList
                  data={recentOffers}
                  renderItem={({ item }) => (
                    <OfferItem
                      item={item}
                      selectedOffer={selectedOffer || ({} as Offer)}
                      handleSelectOffer={handleSelectOffer}
                      offerImageMap={offerImageMap}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  horizontal={true}
                />
              </View>
            )}

            {categoryId && (
              <FlatList
                data={offersByCategory}
                renderItem={({ item }) => (
                  <OfferItem
                    item={item}
                    selectedOffer={selectedOffer || ({} as Offer)}
                    handleSelectOffer={handleSelectOffer}
                    offerImageMap={offerImageMap}
                  />
                )}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                horizontal={false}
              />
            )}
          </View>
          {selectedOffer && (
            <CustomBottomSheet
              offer={selectedOffer}
              open={sheetOpen}
              onClose={() => setSheetOpen(false)}
            />
          )}
        </ScrollView>
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

export default Index;
