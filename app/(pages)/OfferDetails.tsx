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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

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
    let errorMessage = "Failed to initiate transaction. Please try again.";
    if (errorText) {
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
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
      animationType="fade"
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
    setAlertOnConfirm(() => onConfirm);
    setIsAlertVisible(true);
  };

  const hideAlert = () => {
    setIsAlertVisible(false);
    setAlertTitle("");
    setAlertMessage("");
    setAlertOnConfirm(undefined);
  };

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

  const { data: categories, isLoading: categoriesIsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => fetchCategories(token as string),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const { data: offersByCategory } = useQuery({
    queryKey: ["offers-by-category", data?.categoryId],
    queryFn: () =>
      fetchOffersByCategory(token as string, data?.categoryId as number),
    enabled: !!data?.categoryId && !!token,
    staleTime: 1000 * 60 * 5,
  });

  const { data: reviews, isLoading: reviewsIsLoading } = useQuery({
    queryKey: ["reviews", parsedOfferId],
    queryFn: () => fetchReviews(parsedOfferId, token as string),
    enabled: !!token && !isNaN(parsedOfferId),
    staleTime: 1000 * 60 * 5,
  });

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
      let errorMessage = "An unexpected error occurred. Please try again.";
      // Check if the error message contains "Insufficient funds"
      if (err.message.includes("Insufficient funds")) {
        errorMessage = "Insufficient funds"; // Set the specific message
      } else {
        errorMessage = err.message || errorMessage;
      }
      showAlert("Error", errorMessage);
    },
  });

  const isOwner = loggedInUser?.id === data?.ownerId;
  const showStartTransactionButton =
    !isOwner && loggedInUser?.id && data?.id && data?.ownerId;

  const RenderHeader = () => {
    if (!data) return null;

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
                    userId: data?.ownerId?.toString() || "",
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
          }
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
                    params: { offerId: data?.id?.toString() || "" },
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
    backgroundColor: "#F0F7F7",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F7F7",
  },
  infoContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 8,
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
    flexShrink: 1,
  },
  subtext: {
    color: "#666",
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  },
  ratingAndUserInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  rating: {
    marginLeft: 4,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  offerTypeLabel: {
    backgroundColor: "#E0FFFF",
    color: "#008B8B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  userInfo: {
    marginLeft: "auto",
  },
  userProfileLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  username: {
    fontSize: 14,
    color: "#008B8B",
    fontFamily: "Poppins_600SemiBold",
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#008B8B",
  },
  deliveryAndPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  deliveryText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Poppins_500Medium",
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinImage: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  meta: {
    color: "#333",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  errorText: {
    color: "#D32F2F",
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
    top: 20,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
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
    backgroundColor: "#E6F4F4",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#B2D8D8",
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    lineHeight: 22,
  },
  addReviewButton: {
    borderWidth: 1,
    borderColor: "#008B8B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E0F2F2",
  },
  addReviewButtonText: {
    color: "#008B8B",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  startTransactionButton: {
    backgroundColor: "#20B2AA",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  startTransactionButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  horizontalListContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  noOffersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F0FDFD",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
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
    marginTop: 8,
    marginBottom: 4,
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
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: "85%",
    borderWidth: 1,
    borderColor: "#E0FFFF",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  modalMessage: {
    marginBottom: 25,
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    fontFamily: "Poppins_400Regular",
    lineHeight: 22,
  },
  okButton: {
    backgroundColor: "#20B2AA",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 3,
    minWidth: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  okButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
});

export default OfferDetails;
