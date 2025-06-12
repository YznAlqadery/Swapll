// app/(pages)/TransactionDetails.tsx
import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
  // StatusBar, // Removed
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import { Feather } from "@expo/vector-icons";

// --- API Configuration ---
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// --- Transaction Enums and Interfaces (should match your Spring Boot DTOs) ---
enum TransactionStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DECLINED = "DECLINED",
}

interface TransactionDTO {
  id: number;
  createdAt: string;
  updatedAt: string;
  offerId: number;
  sellerId: number;
  buyerId: number;
  status: TransactionStatus;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
}

// --- Offer DTO (Adjust according to your actual Offer DTO structure) ---
interface OfferDTO {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string[]; // Assuming an array of image URLs
  ownerId: number;
  // Add other relevant offer fields if needed (e.g., category, condition)
}

// --- API Fetch Functions ---
async function fetchTransactionById(
  token: string,
  transactionId: number
): Promise<TransactionDTO> {
  const response = await fetch(
    `${API_BASE_URL}/api/transactions/${transactionId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch transaction: ${errorText || response.statusText}`
    );
  }
  return response.json();
}

async function fetchOfferById(
  token: string,
  offerId: number
): Promise<OfferDTO> {
  const response = await fetch(`${API_BASE_URL}/api/offers/${offerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch offer details: ${errorText || response.statusText}`
    );
  }
  return response.json();
}

async function confirmTransaction(
  token: string,
  transactionId: number
): Promise<TransactionDTO> {
  const response = await fetch(
    `${API_BASE_URL}/api/transactions/${transactionId}/confirm`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to confirm transaction: ${errorText || response.statusText}`
    );
  }
  return response.json();
}

const TransactionDetailsPage = () => {
  const router = useRouter();
  const { transactionId, offerId } = useLocalSearchParams<{
    transactionId: string;
    offerId: string;
  }>();
  const { user: token } = useAuth();
  const { user: loggedInUser } = useLoggedInUser();
  const queryClient = useQueryClient();

  // Fetch transaction details
  const {
    data: transaction,
    isLoading: transactionLoading,
    error: transactionError,
  } = useQuery<TransactionDTO>({
    queryKey: ["transactionDetails", transactionId],
    queryFn: () =>
      fetchTransactionById(token as string, parseInt(transactionId)),
    enabled: !!token && !!transactionId,
    staleTime: 0,
  });

  // Fetch offer details
  const {
    data: offer,
    isLoading: offerLoading,
    error: offerError,
  } = useQuery<OfferDTO>({
    queryKey: ["offerDetails", offerId],
    queryFn: () => fetchOfferById(token as string, parseInt(offerId)),
    enabled: !!token && !!offerId,
    staleTime: Infinity,
  });

  // Mutation for confirming transaction
  const confirmMutation = useMutation({
    mutationFn: (id: number) => confirmTransaction(token as string, id),
    onSuccess: (data) => {
      Alert.alert("Success", "Transaction confirmed!", [
        {
          text: "OK",
          onPress: () => {
            queryClient.invalidateQueries({
              queryKey: ["transactionDetails", transactionId],
            });
            queryClient.invalidateQueries({
              queryKey: ["incomingTransactions"],
            });
            queryClient.invalidateQueries({
              queryKey: ["outgoingTransactions"],
            });
          },
        },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to confirm transaction.");
    },
  });

  if (transactionLoading || offerLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008B8B" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </SafeAreaView>
    );
  }

  if (transactionError || offerError || !transaction || !offer) {
    return (
      <SafeAreaView style={styles.emptyStateContainer}>
        <Text style={styles.errorText}>
          {transactionError?.message ||
            offerError?.message ||
            "Could not load transaction or offer details."}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isBuyer = loggedInUser?.id === transaction.buyerId;
  const isSeller = loggedInUser?.id === transaction.sellerId;
  const isConfirmedByCurrentUser = isBuyer
    ? transaction.buyerConfirmed
    : transaction.sellerConfirmed;
  const canConfirm =
    transaction.status === TransactionStatus.ACTIVE &&
    !isConfirmedByCurrentUser;

  return (
    <SafeAreaView style={styles.container}>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#fff" /> // Removed */}
      <View style={styles.headerWrapper}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#008B8B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Transaction Details Section */}
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Transaction Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue}>{transaction.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text
              style={[
                styles.detailValue,
                { color: getStatusColor(transaction.status) },
              ]}
            >
              {transaction.status.replace("_", " ")}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Buyer ID:</Text>
            <Text style={styles.detailValue}>{transaction.buyerId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seller ID:</Text>
            <Text style={styles.detailValue}>{transaction.sellerId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Buyer Confirmed:</Text>
            <Text style={styles.detailValue}>
              {transaction.buyerConfirmed ? "Yes" : "No"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seller Confirmed:</Text>
            <Text style={styles.detailValue}>
              {transaction.sellerConfirmed ? "Yes" : "No"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Initiated:</Text>
            <Text style={styles.detailValue}>
              {new Date(transaction.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated:</Text>
            <Text style={styles.detailValue}>
              {new Date(transaction.updatedAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Offer Details Section */}
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Offer Details</Text>
          {offer.images && offer.images.length > 0 && (
            <Image
              source={{ uri: offer.images[0] }}
              style={styles.offerImage}
            />
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Offer ID:</Text>
            <Text style={styles.detailValue}>{offer.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Title:</Text>
            <Text style={styles.detailValue}>{offer.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>${offer.price}</Text>
          </View>
          <Text style={styles.descriptionLabel}>Description:</Text>
          <Text style={styles.descriptionValue}>{offer.description}</Text>
        </View>

        {/* Action Button */}
        {canConfirm &&
          (loggedInUser?.id === transaction.buyerId ||
            loggedInUser?.id === transaction.sellerId) && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => confirmMutation.mutate(transaction.id)}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Confirm Transaction
                </Text>
              )}
            </TouchableOpacity>
          )}

        {/* Optional: Add more action buttons here (e.g., Reject for PENDING, Contact User) */}
        {/* Example: Contact Button */}
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => {
            const otherUserId = isBuyer
              ? transaction.sellerId
              : transaction.buyerId;
            const otherUsername = isBuyer ? "Seller" : "Buyer"; // You might fetch actual username later
            router.push({
              pathname: "/(pages)/ChatPage",
              params: {
                userId: otherUserId.toString(),
                userName: otherUsername,
              },
            });
          }}
        >
          <Text style={styles.contactButtonText}>
            Contact {isBuyer ? "Seller" : "Buyer"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to get status color
const getStatusColor = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.COMPLETED:
      return "#20B2AA"; // LightSeaGreen
    case TransactionStatus.DECLINED:
      return "#B22222"; // FireBrick
    case TransactionStatus.ACTIVE:
      return "#4682B4"; // SteelBlue
    case TransactionStatus.PENDING:
    default:
      return "#FFA500"; // Orange
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffff",
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 10, // Adjusted after StatusBar removal
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: Platform.OS === "android" ? 10 : 10, // Adjusted after StatusBar removal
    padding: 5,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#008B8B",
    textAlign: "center",
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 30,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#B0C4C4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#008B8B",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: "#555",
    fontWeight: "600",
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
    flex: 1.5,
    textAlign: "right",
  },
  offerImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#e0e0e0",
    resizeMode: "cover",
  },
  descriptionLabel: {
    fontSize: 15,
    color: "#555",
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },
  descriptionValue: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: "#008B8B",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  contactButton: {
    backgroundColor: "#E0FFFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#008B8B",
  },
  contactButtonText: {
    color: "#008B8B",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F7F7",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#008B8B",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F0F7F7",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#008B8B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TransactionDetailsPage;
