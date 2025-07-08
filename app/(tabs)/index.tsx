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
  LogBox,
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useQuery } from "@tanstack/react-query";
import CategoryFlatlist from "@/components/CategoryFlatlist";
import { useAuth } from "@/context/AuthContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";

import Divider from "@/components/Divider";
import { useRouter } from "expo-router";
import SkeletonOfferItem from "@/components/SkeletonOfferItem";

LogBox.ignoreLogs([
  "Warning: Text strings must be rendered within a <Text> component.",
  "Warning: Encountered two children with the same key,",
]);

export interface Offer {
  username: string;
  id: string;
  ownerId: number; // Changed to lowercase 'o' to match typical JSON serialization from Java
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

interface LoggedInUser {
  id: number;
  userName: string;
  email: string;
  balance: number;
  referralCode?: string | undefined;
  myReferralCode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  bio?: string;
  profilePic?: string;
}

type Category = {
  id: number;
  title: string;
};

const OfferItem = React.memo(({ item }: { item: Offer }) => {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const getImageSource = () => {
    if (item.image && !imageError) {
      return { uri: item.image };
    }
    return require("@/assets/images/no_image.jpeg");
  };

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
        {imageLoading && item.image && !imageError && (
          <View style={styles.loadingImage}>
            <ActivityIndicator color="#008b8b" size="small" />
          </View>
        )}

        <Image
          source={getImageSource()}
          style={styles.offerImage}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
      </View>
      <View style={styles.offerDetails}>
        <Text style={styles.offerTitle}>{item.title}</Text>
        <Text style={styles.offerUsername}>by {item.username}</Text>
        <Text
          style={styles.offerDescription}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.description}
        </Text>
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
});

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

// This function now explicitly filters out offers by the given userId
// const filterOffersByUserId = (offers: Offer[], userId: number) => {
//   console.log("Filtering offers. Current userId:", userId);
//   const filtered = offers.filter((offer) => {
//     // Access ownerId with lowercase 'o'
//     console.log(
//       `  Offer ID: ${offer.id}, Offer ownerId: ${
//         offer.ownerId
//       }, Is different? ${offer.ownerId !== userId}`
//     );
//     return offer.ownerId !== userId; // Filter OUT offers by this user
//   });
//   console.log("Filtered offers count:", filtered.length);
//   return filtered;
// };

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

export const fetchUserInfo = async (
  userToken: string
): Promise<LoggedInUser> => {
  console.log("Fetching user info with token:", userToken);
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/user/myinfo`,
    {
      headers: { Authorization: `Bearer ${userToken}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error for /myinfo (${response.status}): ${errorText}`);
    throw new Error(
      `Failed fetching user info: ${errorText || response.statusText}`
    );
  }
  return response.json();
};

const Index = () => {
  const { user: token } = useAuth();
  const { user: loggedInUser, setUser } = useLoggedInUser();

  const [userInfoLoading, setUserInfoLoading] = useState(true);
  const [userInfoError, setUserInfoError] = useState<Error | null>(null);
  const [userInfoRefetching, setUserInfoRefetching] = useState(false);

  const [categoryId, setCategoryId] = useState<number | null>(0);
  const [categoryName, setCategoryName] = useState("All Categories");

  const {
    data: fetchedLoggedInUser,
    isLoading: isUserInfoLoadingQuery,
    isRefetching: isUserInfoRefetchingQuery,
    error: userInfoQueryError,
    refetch: refetchUserInfoQuery,
  } = useQuery<LoggedInUser>({
    queryKey: ["loggedInUser"],
    queryFn: () => fetchUserInfo(token || ""),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
      setUserInfoLoading(false);
      setUserInfoError(null);
      return;
    }

    if (isUserInfoLoadingQuery) {
      setUserInfoLoading(true);
    } else {
      setUserInfoLoading(false);
      if (userInfoQueryError) {
        setUserInfoError(userInfoQueryError as Error);
        setUser(null);
      } else if (fetchedLoggedInUser) {
        setUser(fetchedLoggedInUser);
        setUserInfoError(null);
      }
    }
  }, [
    token,
    fetchedLoggedInUser,
    isUserInfoLoadingQuery,
    userInfoQueryError,
    setUser,
  ]);

  const {
    data: categories,
    isLoading: categoriesLoading,
    isRefetching: categoriesRefetching,
    refetch: refetchCategories,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(token || ""),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: topRatedOffers,
    isLoading: topRatedOffersLoading,
    isRefetching: topRatedOffersRefetching,
    refetch: refetchTopRatedOffers,
  } = useQuery<Offer[]>({
    queryKey: ["top-rated-offers"],
    queryFn: () => fetchTopRatedOffers(token || ""),
    enabled: !!token && categoryId === 0,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: recentOffers,
    isLoading: recentOffersLoading,
    isRefetching: recentOffersRefetching,
    refetch: refetchRecentOffers,
  } = useQuery<Offer[]>({
    queryKey: ["recent-offers"],
    queryFn: () => fetchRecentOffers(token || ""),
    enabled: !!token && categoryId === 0,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: offersByCategory,
    isLoading: offersByCategoryLoading,
    isRefetching: offersByCategoryRefetching,
    refetch: refetchOffersByCategory,
  } = useQuery<Offer[]>({
    queryKey: ["offers-by-category", categoryId],
    queryFn: () => fetchOffersByCategory(token || "", categoryId || 0),
    enabled: !!token && categoryId !== 0,
    staleTime: 5 * 60 * 1000,
  });

  const isPageRefreshing =
    isUserInfoRefetchingQuery ||
    categoriesRefetching ||
    topRatedOffersRefetching ||
    recentOffersRefetching ||
    offersByCategoryRefetching;

  const handleRefresh = useCallback(() => {
    refetchUserInfoQuery();
    refetchCategories();
    if (categoryId === 0) {
      refetchTopRatedOffers();
      refetchRecentOffers();
    } else {
      refetchOffersByCategory();
    }
  }, [
    categoryId,
    refetchUserInfoQuery,
    refetchCategories,
    refetchTopRatedOffers,
    refetchRecentOffers,
    refetchOffersByCategory,
  ]);

  useEffect(() => {
    if (categoryId === 0) {
      setCategoryName("Our Community's Favorites");
    } else if (categories && categoryId !== null) {
      const selectedCat = categories.find((cat) => cat.id === categoryId);
      setCategoryName(selectedCat ? selectedCat.title : "Unknown Category");
    }
  }, [categories, categoryId]);

  const categoriesForFlatlist = React.useMemo(() => {
    const allCategoriesOption = { id: 0, title: "All Categories" };
    return categories
      ? [allCategoriesOption, ...categories]
      : [allCategoriesOption];
  }, [categories]);

  if (userInfoLoading) {
    return (
      <SafeAreaView style={styles.centeredLoading}>
        <ActivityIndicator size="large" color="#008B8B" />
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  if (userInfoError) {
    return (
      <SafeAreaView style={styles.centeredLoading}>
        <Text
          style={{ color: "red", textAlign: "center", marginHorizontal: 20 }}
        >
          Error loading user data: {userInfoError.message}
          {"\n"}Please try refreshing or logging in again.
        </Text>
        <TouchableOpacity
          onPress={handleRefresh}
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor: "#008B8B",
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold" }}>
            Retry
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!loggedInUser) {
    return (
      <SafeAreaView style={styles.centeredLoading}>
        <Text
          style={{ color: "#888", textAlign: "center", marginHorizontal: 20 }}
        >
          Could not retrieve user profile. Please ensure you are logged in
          correctly.
        </Text>
      </SafeAreaView>
    );
  }

  // Helper function to render horizontal FlatLists of offers
  // Added excludeCurrentUserOffers boolean to control filtering
  const renderOfferSection = (
    data: Offer[] | undefined,
    isLoading: boolean,
    title: string,
    excludeCurrentUserOffers: boolean = true // Default to true for most sections
  ) => {
    let displayData = data;

    // Apply filter only if excludeCurrentUserOffers is true
    if (excludeCurrentUserOffers && loggedInUser?.id) {
      displayData = data?.filter((offer) => offer.ownerId !== loggedInUser.id);
    }

    const hasData = displayData && displayData.length > 0;

    return (
      <View>
        <Text style={styles.header}>{title}</Text>
        {isLoading && !isPageRefreshing ? (
          <FlatList
            data={[1, 2, 3]}
            renderItem={() => <SkeletonOfferItem />}
            keyExtractor={(item) => `skeleton-${item}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.skeletonListContainer}
          />
        ) : hasData ? (
          <FlatList
            data={displayData} // Use displayData which is already filtered
            renderItem={({ item }) => <OfferItem item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersListContainer}
          />
        ) : (
          <Text style={styles.noOffersText}>No offers available.</Text>
        )}
      </View>
    );
  };

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

                  <Text style={styles.balanceText}>{loggedInUser.balance}</Text>
                </View>
              </View>

              <Divider />

              <Text style={styles.header}>Popular Categories</Text>
              <View style={{ height: 70 }}>
                {categoriesLoading && !isPageRefreshing ? (
                  <ActivityIndicator size="small" color="#008B8B" />
                ) : categoriesForFlatlist.length > 0 ? (
                  <CategoryFlatlist
                    data={categoriesForFlatlist}
                    selectedCategoryId={categoryId}
                    setSelectedCategoryId={setCategoryId}
                  />
                ) : (
                  <Text style={styles.noOffersText}>No categories found.</Text>
                )}
              </View>

              <Divider />

              {categoryId !== 0 ? (
                renderOfferSection(
                  offersByCategory,
                  offersByCategoryLoading,
                  `Offers in ${categoryName}`,
                  true // Exclude current user's offers from category view
                )
              ) : (
                <>
                  {renderOfferSection(
                    topRatedOffers,
                    topRatedOffersLoading,
                    categoryName,
                    true // Exclude current user's offers from top rated
                  )}
                  <Divider />
                  {renderOfferSection(
                    recentOffers,
                    recentOffersLoading,
                    "Latest Deals for You",
                    true // Exclude current user's offers here
                  )}
                </>
              )}

              <View style={{ height: 60 }} />
            </View>
          }
          onRefresh={handleRefresh}
          refreshing={isPageRefreshing}
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    zIndex: 1,
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
  centeredLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F7F7",
  },
  noOffersText: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    fontSize: 16,
    color: "#888",
    fontFamily: "Poppins_400Regular",
  },
  offersListContainer: {
    paddingHorizontal: 0,
  },
  skeletonListContainer: {
    paddingHorizontal: 0,
  },
});

export default Index;
