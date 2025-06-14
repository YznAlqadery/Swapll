import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { fetchCategories, fetchOffersByCategory } from "../(tabs)";
import OfferCard from "@/components/OfferCard";
import ReviewItem from "@/components/ReviewItem";
import Divider from "@/components/Divider";
import { useLoggedInUser } from "@/context/LoggedInUserContext";

// --- API Configuration ---
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

// --- Transaction DTO Interface (Copy from your TransactionDetails.tsx) ---
interface TransactionDTO {
  id: number;
  createdAt: string;
  updatedAt: string;
  offerId: number;
  sellerId: number;
  buyerId: number;
  status: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
}

// --- API Function to fetch reviews ---
async function fetchReviews(offerId: number, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/reviews/offer/${offerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch reviews: ${errorText || response.statusText}`
    );
  }
  return response.json();
}

// --- API Function to initiate a transaction ---
async function initiateTransaction(
  token: string,
  sellerId: number,
  offerId: number
): Promise<TransactionDTO> {
  const response = await fetch(
    `${API_BASE_URL}/api/transaction/${sellerId}/${offerId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to initiate transaction: ${errorText || response.statusText}`
    );
  }
  return response.json();
}

// --- Custom Alert Modal Component ---
interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void; // Optional callback for "OK" button
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  isVisible,
  title,
  message,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      animationType="fade" // Or "slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.centeredView} onPress={onClose}>
        <View style={modalStyles.modalView}>
          <Text style={modalStyles.modalTitle}>{title}</Text>
          <Text style={modalStyles.modalMessage}>{message}</Text>
          <TouchableOpacity
            style={modalStyles.okButton}
            onPress={() => {
              onClose();
              if (onConfirm) onConfirm();
            }}
          >
            <Text style={modalStyles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const OfferDetails = () => {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const { user: loggedInUser } = useLoggedInUser();
  const { user: token } = useAuth();
  const queryClient = useQueryClient();

  const router = useRouter();

  const parsedOfferId = parseInt(offerId as string);

  // --- State for Custom Alert Modal ---
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<
    (() => void) | undefined
  >(undefined);

  const showAlert = (
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => onConfirm); // Set the function for the callback
    setIsAlertVisible(true);
  };

  const hideAlert = () => {
    setIsAlertVisible(false);
    setAlertTitle("");
    setAlertMessage("");
    setAlertOnConfirm(undefined);
  };

  // Fetch offer details
  const {
    data,
    error,
    isLoading: dataIsLoading,
  } = useQuery({
    queryKey: ["offer", parsedOfferId],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/offer/${parsedOfferId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch offer: ${errorText || response.statusText}`
        );
      }
      return response.json();
    },
    enabled: !!token && !isNaN(parsedOfferId),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch categories (used for offer category display)
  const { data: categories, isLoading: categoriesIsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => fetchCategories(token as string),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch related offers by category
  const { data: offersByCategory } = useQuery({
    queryKey: ["offers-by-category", data?.categoryId],
    queryFn: () =>
      fetchOffersByCategory(token as string, data?.categoryId as number),
    enabled: !!data?.categoryId && !!token,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch reviews for the offer
  const { data: reviews, isLoading: reviewsIsLoading } = useQuery({
    queryKey: ["reviews", parsedOfferId],
    queryFn: () => fetchReviews(parsedOfferId, token as string),
    enabled: !!token && !isNaN(parsedOfferId),
    staleTime: 1000 * 60 * 5,
  });

  // Mutation for initiating a transaction
  const startTransactionMutation = useMutation({
    mutationFn: (args: { sellerId: number; offerId: number }) =>
      initiateTransaction(token as string, args.sellerId, args.offerId),
    onSuccess: (newTransaction) => {
      showAlert("Success", "Transaction initiated successfully!", () => {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({
          queryKey: ["incomingTransactions"],
        });
        queryClient.invalidateQueries({
          queryKey: ["outgoingTransactions"],
        });

        router.push({
          pathname: "/(pages)/TransactionPage",
          params: {
            transactionId: newTransaction.id.toString(),
            offerId: newTransaction.offerId.toString(),
          },
        });
      });
    },
    onError: (err: Error) => {
      showAlert(
        "Error",
        "Could not start the transaction. Please check your internet connection and try again. If the problem persists, contact support."
      );
    },
  });

  const isOwner = loggedInUser?.id === data?.ownerId;
  const showStartTransactionButton =
    !isOwner && loggedInUser?.id && data?.id && data?.ownerId;

  const RenderHeader = () => {
    if (!data) return null;

    // Helper to determine payment method string
    const getPaymentMethodString = (method: string | undefined) => {
      switch (method) {
        case "BOTH":
          return "Allow Swap & Swapll Coin";
        case "COIN":
          return "Swapll Coin";
        case "SWAP":
          return "Allow Swap";
        default:
          return "N/A Payment Method";
      }
    };

    return (
      <>
        <View style={styles.imageWrapper}>
          {data?.image ? (
            <Image source={{ uri: data.image }} style={styles.offerImage} />
          ) : (
            <Image
              source={require("@/assets/images/no_image.jpeg")}
              style={styles.offerImage}
              resizeMode="cover"
            />
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#008B8B" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{data.title || "N/A"}</Text>
          </View>
          <Text style={styles.subtext}>
            {categories?.find((cat: any) => cat.id === data?.categoryId)
              ?.title || "Unknown Category"}{" "}
            • {getPaymentMethodString(data?.paymentMethod)}
          </Text>
          <Divider />
          <View style={styles.ratingAndUserInfoRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />{" "}
              {/* Ensure space is part of a Text component if needed */}
              <Text style={styles.rating}>
                {typeof data?.averageRating === "number"
                  ? data.averageRating.toFixed(1)
                  : "N/A"}{" "}
                ({data?.numberOfReviews?.toString() || "0"})
              </Text>
            </View>
            <Text style={styles.offerTypeLabel}>{data?.type || "N/A"}</Text>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() =>
                router.push({
                  pathname: "/(pages)/UserProfile",
                  params: {
                    userId: data?.ownerId?.toString() || "", // Ensure userId is a string
                  },
                })
              }
            >
              <View style={styles.userProfileLink}>
                <Image
                  source={
                    data.profilePic
                      ? { uri: data.profilePic }
                      : require("@/assets/images/profile-pic-placeholder.png")
                  }
                  style={styles.profileImage}
                />
                <Text style={styles.username}>{data.username || "N/A"}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.deliveryAndPriceRow}>
            <FontAwesome
              name="truck"
              size={16}
              color="#008B8B"
              style={{ marginRight: 6 }}
            />
            {/* Wrap the entire text segment including the dot in one Text component */}
            {typeof data?.deliveryTime === "number" && data.deliveryTime > 2 ? (
              <Text style={styles.deliveryText}>
                {data.deliveryTime - 2}–{data.deliveryTime + 2} days •
              </Text>
            ) : (
              <Text style={styles.deliveryText}>Very fast delivery •</Text>
            )}

            <View style={styles.priceContainer}>
              <Image
                source={require("@/assets/images/swapll_coin.png")}
                style={styles.coinImage}
              />
              <Text style={styles.meta}>
                {data?.price?.toString() || "N/A"}
              </Text>
            </View>
          </View>

          {data?.createdAt && (
            <View style={styles.dateContainer}>
              <FontAwesome
                name="calendar"
                size={16}
                color="#008B8B"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.meta}>
                {new Date(data.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}

          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {data?.description || "No description available."}
            </Text>
          </View>

          {/* Start Transaction Button - only show if not owner and all IDs are available */}
          {showStartTransactionButton && (
            <TouchableOpacity
              style={styles.startTransactionButton}
              onPress={() =>
                startTransactionMutation.mutate({
                  sellerId: data.ownerId,
                  offerId: data.id,
                })
              }
              disabled={startTransactionMutation.isPending}
            >
              {startTransactionMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startTransactionButtonText}>
                  Start Transaction
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Divider />

        <Text style={styles.sectionTitle}>Picks for you 🔥</Text>
        <FlatList
          data={offersByCategory?.filter((item: any) => item.id !== data?.id)}
          keyExtractor={(item, index) =>
            item.id?.toString() || `offer-${index}`
          } // Robust keyExtractor
          renderItem={({ item }) => (
            <OfferCard
              id={item.id}
              title={item.title}
              price={item.price}
              image={item.image}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
        />
        {offersByCategory?.filter((item: any) => item.id !== data?.id)
          .length === 0 && (
          <View style={styles.noOffersContainer}>
            <Text style={styles.noOffersText}>No offers yet</Text>
          </View>
        )}
        <Divider />

        <View style={styles.reviewsHeader}>
          <Text style={styles.reviewsTitle}>
            Reviews ({reviews?.length?.toString() || "0"})
          </Text>

          {loggedInUser?.id !== data?.ownerId &&
            !reviews?.some(
              (r: { userId: number | undefined }) =>
                r.userId === loggedInUser?.id
            ) && (
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() =>
                  router.push({
                    pathname: "/(pages)/AddReview",
                    params: { offerId: data?.id?.toString() || "" }, // Ensure offerId is a string
                  })
                }
              >
                <Text style={styles.addReviewButtonText}>Add Review</Text>
              </TouchableOpacity>
            )}
        </View>
      </>
    );
  };

  if (dataIsLoading || categoriesIsLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle={"dark-content"} />
        <ActivityIndicator size="large" color="#008B8B" />
        <Text style={styles.loadingText}>Loading offer details...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle={"dark-content"} />
        <Text style={styles.errorText}>
          Failed to load offer: {error.message}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={"dark-content"} />
      {reviewsIsLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#008B8B" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item, index) =>
            item.id?.toString() || `review-${index}`
          }
          renderItem={({ item }) => <ReviewItem review={item} />}
          ListHeaderComponent={RenderHeader}
          ListEmptyComponent={
            <View style={styles.noReviewsContainer}>
              <Text style={styles.noReviewsText}>No reviews yet</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <CustomAlertModal
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={hideAlert}
        onConfirm={alertOnConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7", // Lighter background for the entire screen
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F7F7",
  },
  infoContainer: {
    padding: 16,
    backgroundColor: "#fff", // White background for the info section
    marginHorizontal: 0, // Ensure it spans full width
    borderBottomLeftRadius: 12, // Match image border radius
    borderBottomRightRadius: 12, // Match image border radius
    marginBottom: 8, // Space before the divider
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    flexShrink: 1, // Allow text to wrap
  },
  subtext: {
    color: "#666", // Slightly darker grey for better readability
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  },
  ratingAndUserInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8, // Space after this row
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12, // Space between rating and type label
  },
  rating: {
    marginLeft: 4,
    fontWeight: "bold",
    color: "#333", // Darker text for rating
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  offerTypeLabel: {
    backgroundColor: "#E0FFFF",
    color: "#008B8B",
    paddingHorizontal: 8, // Increased padding
    paddingVertical: 4, // Increased padding
    borderRadius: 6, // Slightly more rounded
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold", // Bolder font for labels
  },
  userInfo: {
    marginLeft: "auto", // Pushes user info to the right
  },
  userProfileLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20, // More rounded for profile link
  },
  username: {
    fontSize: 14,
    color: "#008B8B",
    fontFamily: "Poppins_600SemiBold",
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15, // Half of width/height for perfect circle
    borderWidth: 1.5, // Slightly thinner border
    borderColor: "#008B8B",
  },
  deliveryAndPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10, // More space
  },
  deliveryText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Poppins_500Medium", // Medium font for delivery
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinImage: {
    width: 20, // Slightly smaller coin image
    height: 20,
    marginRight: 4, // Closer to the price text
  },
  meta: {
    color: "#333", // Darker color for price
    fontSize: 16, // Larger price font
    fontFamily: "Poppins_600SemiBold",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8, // Space before description
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 16, // Added margin top for better spacing
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  errorText: {
    color: "#D32F2F", // A more distinct red for errors
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#008B8B",
    fontFamily: "Poppins_500Medium",
  },
  backButton: {
    position: "absolute",
    top: 20, // More padding from top
    left: 16, // More padding from left
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8, // Increased vertical padding
    borderRadius: 25, // More rounded for a prominent button
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, // Slightly more visible shadow
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
  },
  offerImage: {
    width: "100%",
    height: 350,
    resizeMode: "cover",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  descriptionBox: {
    backgroundColor: "#E6F4F4", // New color for description box
    padding: 15, // Increased padding
    borderRadius: 10, // Slightly more rounded
    marginTop: 20, // More space from previous elements
    borderWidth: 1, // Subtle border
    borderColor: "#B2D8D8", // New border color
  },
  descriptionText: {
    fontSize: 15, // Slightly larger font
    fontFamily: "Poppins_400Regular",
    color: "#333", // Darker text for readability
    lineHeight: 22, // Better line spacing
  },
  addReviewButton: {
    borderWidth: 1,
    borderColor: "#008B8B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6, // Slightly more padding
    backgroundColor: "#E0F2F2", // Light background for button
  },
  addReviewButtonText: {
    color: "#008B8B",
    fontSize: 15, // Adjusted font size
    fontFamily: "Poppins_600SemiBold", // Bolder font
  },
  startTransactionButton: {
    backgroundColor: "#20B2AA", // Your primary action color
    paddingVertical: 16, // More prominent padding
    borderRadius: 12, // More rounded corners
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30, // More space from description
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, // Stronger shadow
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  startTransactionButtonText: {
    color: "#fff",
    fontSize: 20, // Larger text for main action
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  horizontalListContent: {
    paddingHorizontal: 16, // Padding for the horizontal list
    paddingBottom: 10,
  },
  noOffersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F0FDFD",
    borderRadius: 8,
    marginHorizontal: 16, // Align with other content
    marginTop: 10,
    marginBottom: 20, // Space before next divider
    alignItems: "center", // Center text
  },
  noOffersText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#008B8B",
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8, // Space from the divider
    marginBottom: 4, // Space before review items
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  noReviewsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F0FDFD",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  noReviewsText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#008B8B",
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)", // Slightly darker overlay
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 15, // Slightly less rounded
    padding: 30, // Reduced padding
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4, // Stronger shadow
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: "85%", // Slightly wider modal
    borderWidth: 1, // Subtle border
    borderColor: "#E0FFFF",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 22, // Larger title
    fontWeight: "bold",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  modalMessage: {
    marginBottom: 25, // More space
    textAlign: "center",
    fontSize: 16,
    color: "#555", // Slightly softer black
    fontFamily: "Poppins_400Regular",
    lineHeight: 22, // Better line height
  },
  okButton: {
    backgroundColor: "#20B2AA",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25, // Wider button
    elevation: 3,
    minWidth: 120, // Minimum width
    alignItems: "center",
    shadowColor: "#000", // Shadow for button
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  okButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 17, // Slightly larger text
    fontFamily: "Poppins_600SemiBold",
  },
});

export default OfferDetails;
