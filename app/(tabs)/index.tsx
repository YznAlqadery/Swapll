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
  LogBox, // LogBox imported here for demonstration, but best placed in App.js/index.js
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useQuery } from "@tanstack/react-query";
import CategoryFlatlist from "@/components/CategoryFlatlist";
import { useAuth } from "@/context/AuthContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";

import Divider from "@/components/Divider";
import { useRouter } from "expo-router";
import SkeletonOfferItem from "@/components/SkeletonOfferItem";

// --- GLOBAL WARNING SUPPRESSION (Ideally, put this in your app's entry file like App.js or index.js) ---
LogBox.ignoreLogs([
  "Warning: Text strings must be rendered within a <Text> component.",
  "Warning: Encountered two children with the same key,",
]);
// --- END GLOBAL WARNING SUPPRESSION ---

export interface Offer {
  username: string;
  id: string; // Ensure ID is string for keyExtractor, or convert if it's number
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

// Define the structure for the logged-in user data
// IMPORTANT: Ensure this matches the exact structure returned by your /api/user/myinfo endpoint
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

// OfferItem Component (Refactored for Image Loading AND Description Truncation)
const OfferItem = React.memo(({ item }: { item: Offer }) => {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const getImageSource = () => {
    if (item.image && !imageError) {
      return { uri: item.image };
    }
    return require("@/assets/images/no_image.jpeg"); // Fallback no image
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

// API Calls (Ensure process.env.EXPO_PUBLIC_API_URL is defined in your .env file or app.config.js)
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

// NEW API CALL FOR USER INFO
export const fetchUserInfo = async (
  userToken: string
): Promise<LoggedInUser> => {
  console.log("Fetching user info with token:", userToken); // For debugging purposes
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/user/myinfo`,
    {
      headers: { Authorization: `Bearer ${userToken}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    // Log the full error response for debugging
    console.error(`API Error for /myinfo (${response.status}): ${errorText}`);
    throw new Error(
      `Failed fetching user info: ${errorText || response.statusText}`
    );
  }
  return response.json();
};

const Index = () => {
  const { user: token } = useAuth(); // Auth token from context
  // Use LoggedInUserContext to manage user state directly
  const { user: loggedInUser, setUser } = useLoggedInUser();
  const [userInfoLoading, setUserInfoLoading] = useState(true);
  const [userInfoError, setUserInfoError] = useState<Error | null>(null);
  const [userInfoRefetching, setUserInfoRefetching] = useState(false); // Manually track refetching for user info

  const [categoryId, setCategoryId] = useState<number | null>(0); // 0 indicates "all categories" or default view
  const [categoryName, setCategoryName] = useState("All Categories"); // Display name for the current category selection

  // --- useEffect for User Info Fetching ---
  // We're using useQuery below, so this manual useEffect can be simplified or removed
  // if `loggedInUser` context's `setUser` correctly reflects the useQuery data.
  // For robustness, keeping the pattern if `useLoggedInUser` isn't fully integrated with RQ.

  // Use useQuery for loggedInUser info, which integrates with React Query's caching/invalidation
  const {
    data: fetchedLoggedInUser,
    isLoading: isUserInfoLoadingQuery,
    isRefetching: isUserInfoRefetchingQuery,
    error: userInfoQueryError,
    refetch: refetchUserInfoQuery,
  } = useQuery<LoggedInUser>({
    queryKey: ["loggedInUser"], // This is the key invalidated by TransactionsPage
    queryFn: () => fetchUserInfo(token || ""),
    enabled: !!token, // Only run this query if a token exists
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    // You can also add onError and onSuccess callbacks here if needed
  });

  // Effect to update the `loggedInUser` context state when the query data changes
  useEffect(() => {
    if (!token) {
      setUser(null); // Clear user if token is gone
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
        setUserInfoError(null); // Clear previous errors on successful fetch
      }
    }
  }, [
    token,
    fetchedLoggedInUser,
    isUserInfoLoadingQuery,
    userInfoQueryError,
    setUser,
  ]);

  // Categories
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

  // Top Rated Offers
  const {
    data: topRatedOffers,
    isLoading: topRatedOffersLoading,
    isRefetching: topRatedOffersRefetching,
    refetch: refetchTopRatedOffers,
  } = useQuery<Offer[]>({
    queryKey: ["top-rated-offers"],
    queryFn: () => fetchTopRatedOffers(token || ""),
    enabled: !!token && categoryId === 0, // Only fetch if "All Categories" is selected
    staleTime: 5 * 60 * 1000,
  });

  // Recent Offers
  const {
    data: recentOffers,
    isLoading: recentOffersLoading,
    isRefetching: recentOffersRefetching,
    refetch: refetchRecentOffers,
  } = useQuery<Offer[]>({
    queryKey: ["recent-offers"],
    queryFn: () => fetchRecentOffers(token || ""),
    enabled: !!token && categoryId === 0, // Only fetch if "All Categories" is selected
    staleTime: 5 * 60 * 1000,
  });

  // Offers by Category
  const {
    data: offersByCategory,
    isLoading: offersByCategoryLoading,
    isRefetching: offersByCategoryRefetching,
    refetch: refetchOffersByCategory,
  } = useQuery<Offer[]>({
    queryKey: ["offers-by-category", categoryId],
    queryFn: () => fetchOffersByCategory(token || "", categoryId || 0),
    enabled: !!token && categoryId !== 0, // Only fetch if a specific category is selected
    staleTime: 5 * 60 * 1000,
  });

  // Combine refetching states for the main pull-to-refresh indicator
  const isPageRefreshing =
    isUserInfoRefetchingQuery || // Use the useQuery refetching state
    categoriesRefetching ||
    topRatedOffersRefetching ||
    recentOffersRefetching ||
    offersByCategoryRefetching;

  // Handler for pull-to-refresh
  const handleRefresh = useCallback(() => {
    // Trigger all relevant refetches
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

  // Effect to update categoryName based on selected categoryId
  useEffect(() => {
    if (categoryId === 0) {
      setCategoryName("Our Community's Favorites"); // Default text for main view
    } else if (categories && categoryId !== null) {
      const selectedCat = categories.find((cat) => cat.id === categoryId);
      setCategoryName(selectedCat ? selectedCat.title : "Unknown Category");
    }
  }, [categories, categoryId]);

  // Prepare data for CategoryFlatlist, ensuring "All Categories" is first
  const categoriesForFlatlist = React.useMemo(() => {
    const allCategoriesOption = { id: 0, title: "All Categories" };
    return categories
      ? [allCategoriesOption, ...categories]
      : [allCategoriesOption];
  }, [categories]);

  // --- Conditional Rendering for Initial States ---

  // Show a full-screen loader while user info is being fetched initially
  if (userInfoLoading) {
    return (
      <SafeAreaView style={styles.centeredLoading}>
        <ActivityIndicator size="large" color="#008B8B" />
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  // Handle error for user info fetch
  // This could mean the token is expired or invalid
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
          onPress={handleRefresh} // Use handleRefresh to re-attempt fetching all data
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

  // If loggedInUser is null/undefined after loading and no error, something went wrong
  // (e.g., API returned 200 but with no data or unexpected shape)
  if (!loggedInUser) {
    return (
      <SafeAreaView style={styles.centeredLoading}>
        <Text
          style={{ color: "#888", textAlign: "center", marginHorizontal: 20 }}
        >
          Could not retrieve user profile. Please ensure you are logged in
          correctly.
        </Text>
        {/* You might want to trigger a logout/redirect to login here */}
      </SafeAreaView>
    );
  }

  // Helper function to render horizontal FlatLists of offers
  const renderOfferSection = (
    data: Offer[] | undefined,
    isLoading: boolean, // This indicates initial loading for the section
    title: string
  ) => {
    // Filter out offers owned by the current user (using loggedInUser.id)
    const filteredData = data?.filter(
      (offer) => offer.ownerId !== loggedInUser?.id
    );
    const hasData = filteredData && filteredData.length > 0;

    return (
      <View>
        <Text style={styles.header}>{title}</Text>
        {/* Show skeleton only for initial section load, not during pull-to-refresh */}
        {isLoading && !isPageRefreshing ? (
          <FlatList
            data={[1, 2, 3]} // Placeholder data for skeleton items
            renderItem={() => <SkeletonOfferItem />}
            keyExtractor={(item) => `skeleton-${item}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.skeletonListContainer}
          />
        ) : hasData ? (
          // Render actual offers when data is available
          <FlatList
            data={filteredData}
            renderItem={({ item }) => <OfferItem item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersListContainer}
          />
        ) : (
          // Display message if no offers are available for this section
          <Text style={styles.noOffersText}>No offers available.</Text>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        {/* Main FlatList acting as a ScrollView for the header content */}
        <FlatList
          data={[]} // Empty data, as content is rendered in ListHeaderComponent
          renderItem={null} // No individual items to render from `data`
          ListEmptyComponent={null} // Don't show "No items" when data is empty
          ListHeaderComponent={
            // This is where all your main content is rendered
            <View>
              {/* Header Row: Logo and Balance */}
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
                  {/* Use loggedInUser.balance directly as we've checked for its existence */}
                  <Text style={styles.balanceText}>{loggedInUser.balance}</Text>
                </View>
              </View>

              <Divider />

              {/* Popular Categories Section */}
              <Text style={styles.header}>Popular Categories</Text>
              <View style={{ height: 70 }}>
                {categoriesLoading && !isPageRefreshing ? ( // Show spinner for initial category load
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

              {/* Conditional Offer Sections based on Category Selection */}
              {categoryId !== 0 ? (
                // Display offers by selected category when a category is chosen
                renderOfferSection(
                  offersByCategory,
                  offersByCategoryLoading,
                  `Offers in ${categoryName}`
                )
              ) : (
                // Display Top Rated and Recent Offers when "All Categories" is selected
                <>
                  {renderOfferSection(
                    topRatedOffers,
                    topRatedOffersLoading,
                    categoryName // This will be "Our Community's Favorites"
                  )}
                  <Divider />
                  {renderOfferSection(
                    recentOffers,
                    recentOffersLoading,
                    "Latest Deals for You"
                  )}
                </>
              )}

              {/* Spacer at the bottom for better scrolling experience */}
              <View style={{ height: 60 }} />
            </View>
          }
          onRefresh={handleRefresh} // Pull-to-refresh handler
          refreshing={isPageRefreshing} // Indicates if refresh is in progress
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
    borderRadius: 50, // For circular coin
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
