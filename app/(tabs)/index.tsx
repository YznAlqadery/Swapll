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
import { useQuery } from "@tanstack/react-query";
import CategoryFlatlist from "@/components/CategoryFlatlist"; // Your updated component
import { useAuth } from "@/context/AuthContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";

import Divider from "@/components/Divider";
import { useRouter } from "expo-router";
import SkeletonOfferItem from "@/components/SkeletonOfferItem";

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

// OfferItem Component (Refactored for Image Loading)
const OfferItem = React.memo(({ item }: { item: Offer }) => {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Determine the image source based on item.image availability and error status
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
        {/* Show ActivityIndicator while image is loading, only if a valid image URI exists */}
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
            setImageError(true); // Set error state to show fallback image
          }}
        />
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
});

// API Calls (Kept as is, but ensure process.env.EXPO_PUBLIC_API_URL is defined)
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
  const [categoryId, setCategoryId] = useState<number | null>(0); // 0 indicates "all categories" or default view
  const [categoryName, setCategoryName] = useState("All Categories"); // Display name for the current category selection

  // --- Data Fetching with useQuery ---
  // Categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    // error: categoriesError, // Error handling can be added if needed
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(token || ""),
    enabled: !!token, // Only fetch if token is available
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (adjust as needed)
  });

  // Top Rated Offers (fetched only when categoryId is 0, i.e., "All Categories" view)
  const {
    data: topRatedOffers,
    isLoading: topRatedOffersLoading,
    // error: topRatedOffersError,
  } = useQuery<Offer[]>({
    queryKey: ["top-rated-offers"],
    queryFn: () => fetchTopRatedOffers(token || ""),
    enabled: !!token && categoryId === 0, // Only fetch if token and on default view
    staleTime: 5 * 60 * 1000,
  });

  // Recent Offers (fetched only when categoryId is 0)
  const {
    data: recentOffers,
    isLoading: recentOffersLoading,
    // error: recentOffersError,
  } = useQuery<Offer[]>({
    queryKey: ["recent-offers"],
    queryFn: () => fetchRecentOffers(token || ""),
    enabled: !!token && categoryId === 0, // Only fetch if token and on default view
    staleTime: 5 * 60 * 1000,
  });

  // Offers by Category (fetched only when a specific category is selected, i.e., categoryId is not 0)
  const {
    data: offersByCategory,
    isLoading: offersByCategoryLoading,
    // error: offersByCategoryError,
  } = useQuery<Offer[]>({
    queryKey: ["offers-by-category", categoryId],
    queryFn: () => fetchOffersByCategory(token || "", categoryId || 0),
    enabled: !!token && categoryId !== 0, // Only fetch if token and a specific category is selected
    staleTime: 5 * 60 * 1000,
  });

  // Effect to fetch user info on token change
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
  }, [token, setUser]);

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

  // Initial loading state for user data (before main content renders)
  if (!user) {
    return (
      <SafeAreaView style={styles.centeredLoading}>
        <ActivityIndicator size="large" color="#008B8B" />
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  // Helper function to render horizontal FlatLists of offers
  const renderOfferSection = (
    data: Offer[] | undefined,
    isLoading: boolean,
    title: string
  ) => {
    // Filter out offers owned by the current user
    const filteredData = data?.filter((offer) => offer.ownerId !== user?.id);
    const hasData = filteredData && filteredData.length > 0;

    return (
      <View>
        <Text style={styles.header}>{title}</Text>
        {isLoading ? (
          // Render skeleton items when loading
          <FlatList
            data={[1, 2, 3]} // Array of placeholders for skeleton items
            renderItem={() => <SkeletonOfferItem />}
            keyExtractor={(item) => `skeleton-${item}`}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        ) : hasData ? (
          // Render actual offers when data is available
          <FlatList
            data={filteredData}
            renderItem={({ item }) => <OfferItem item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
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
          data={[]} // Empty data, as content is in ListHeaderComponent
          renderItem={null}
          ListEmptyComponent={null}
          ListHeaderComponent={
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
                  <Text style={styles.balanceText}>{user?.balance}</Text>
                </View>
              </View>

              <Divider />

              {/* Popular Categories Section */}
              <Text style={styles.header}>Popular Categories</Text>
              <View style={{ height: 70 }}>
                {categoriesLoading ? (
                  <ActivityIndicator size="small" color="#008B8B" />
                ) : categoriesForFlatlist.length > 0 ? ( // Use categoriesForFlatlist here
                  <CategoryFlatlist
                    data={categoriesForFlatlist}
                    selectedCategoryId={categoryId}
                    setSelectedCategoryId={setCategoryId}
                    // The setCategoryName prop is removed as its logic is now handled in Index.tsx's useEffect
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
    // alignSelf: "center", // Removed as FlatList handles horizontal alignment
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
    position: "absolute", // Position over the image container
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0", // Light background for loading
    borderRadius: 12,
    zIndex: 1, // Ensure it's above the image if image takes time to load
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
    marginBottom: 20, // Added margin for spacing
    fontSize: 16,
    color: "#888",
    fontFamily: "Poppins_400Regular",
  },
});

export default Index;
