// app/(pages)/TransactionsPage.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  // StatusBar, // Removed
  Platform, // Import Platform for StatusBar height on Android
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext"; // Assuming useAuth provides the token
import { useLoggedInUser } from "@/context/LoggedInUserContext"; // Assuming useLoggedInUser provides the user ID
import { Feather } from "@expo/vector-icons"; // For back arrow icon and other UI elements if needed

// --- API Configuration ---
// Ensure this environment variable is correctly set in your .env file
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
  createdAt: string; // Use string as DateTimes are usually sent as ISO strings from backend
  updatedAt: string;
  offerId: number;
  sellerId: number;
  buyerId: number;
  status: TransactionStatus;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
}

// --- API Fetch Functions ---
// These functions fetch data using the user's authentication token
async function fetchOutgoingTransactions(
  token: string
): Promise<TransactionDTO[]> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/outgoing`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch outgoing transactions: ${
        errorText || response.statusText
      }`
    );
  }
  return response.json();
}

async function fetchIncomingTransactions(
  token: string
): Promise<TransactionDTO[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/transactions/seller-transactions`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch incoming transactions: ${
        errorText || response.statusText
      }`
    );
  }
  return response.json();
}

// --- TransactionItem Component ---
// This component renders a single transaction item in the list
const TransactionItem = React.memo(
  ({
    item,
    currentUserId,
  }: {
    item: TransactionDTO;
    currentUserId: number | undefined;
  }) => {
    const router = useRouter();

    const isBuyer = currentUserId === item.buyerId;
    const isSeller = currentUserId === item.sellerId;

    // Determine the role for display based on the current user
    const roleText = isBuyer ? "Buyer" : isSeller ? "Seller" : "Participant"; // Fallback 'Participant'

    // Set color based on transaction status for visual feedback
    const statusColor =
      item.status === TransactionStatus.COMPLETED
        ? "#20B2AA" // LightSeaGreen for completed
        : item.status === TransactionStatus.DECLINED
        ? "#B22222" // FireBrick for declined
        : "#FFA500"; // Orange for pending/active

    const handlePress = () => {
      // Navigate to a detailed view of the transaction
      // You would create a TransactionDetails.tsx page for this
      router.push({
        pathname: "/(pages)/TransactionDetails",
        params: {
          transactionId: item.id.toString(),
          offerId: item.offerId.toString(),
        },
      });
    };

    return (
      <TouchableOpacity style={styles.transactionItem} onPress={handlePress}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionTitle}>Offer ID: {item.offerId}</Text>
          <Text style={[styles.transactionStatus, { color: statusColor }]}>
            {item.status.replace("_", " ")} {/* Format status for display */}
          </Text>
        </View>
        <Text style={styles.transactionDetails}>
          Your Role: <Text style={styles.boldText}>{roleText}</Text>
        </Text>
        <Text style={styles.transactionDetails}>
          Buyer: <Text style={styles.boldText}>{item.buyerId}</Text>
        </Text>
        <Text style={styles.transactionDetails}>
          Seller: <Text style={styles.boldText}>{item.sellerId}</Text>
        </Text>
        <Text style={styles.transactionDetails}>
          Initiated:{" "}
          <Text style={styles.boldText}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </Text>
        <Text style={styles.transactionDetails}>
          Buyer Confirmed:{" "}
          <Text style={styles.boldText}>
            {item.buyerConfirmed ? "Yes" : "No"}
          </Text>
        </Text>
        <Text style={styles.transactionDetails}>
          Seller Confirmed:{" "}
          <Text style={styles.boldText}>
            {item.sellerConfirmed ? "Yes" : "No"}
          </Text>
        </Text>
      </TouchableOpacity>
    );
  }
);

// --- TransactionsPage Component ---
const TransactionsPage = () => {
  const router = useRouter();
  const { user: token } = useAuth(); // Get auth token for API calls
  const { user } = useLoggedInUser(); // Get current user's ID for role determination

  // State to control which filter is active: 'incoming' or 'outgoing'
  const [activeFilter, setActiveFilter] = useState<"incoming" | "outgoing">(
    "incoming" // Default to showing incoming transactions
  );

  // useQuery hook for fetching incoming transactions (where current user is seller)
  const {
    data: incomingTransactions,
    isLoading: incomingLoading,
    error: incomingError,
  } = useQuery<TransactionDTO[]>({
    queryKey: ["incomingTransactions", user?.id], // Cache key includes user ID
    queryFn: () => fetchIncomingTransactions(token as string),
    enabled: activeFilter === "incoming" && !!user && !!token, // Only fetch if filter is 'incoming' and user/token exist
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
  });

  // useQuery hook for fetching outgoing transactions (where current user is buyer)
  const {
    data: outgoingTransactions,
    isLoading: outgoingLoading,
    error: outgoingError,
  } = useQuery<TransactionDTO[]>({
    queryKey: ["outgoingTransactions", user?.id], // Cache key includes user ID
    queryFn: () => fetchOutgoingTransactions(token as string),
    enabled: activeFilter === "outgoing" && !!user && !!token, // Only fetch if filter is 'outgoing' and user/token exist
    staleTime: 5 * 60 * 1000,
  });

  // Determine current loading state, error, and data based on the active filter
  const isLoading =
    activeFilter === "incoming" ? incomingLoading : outgoingLoading;
  const error = activeFilter === "incoming" ? incomingError : outgoingError;
  const data =
    activeFilter === "incoming" ? incomingTransactions : outgoingTransactions;

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
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      {/* Filter Buttons: Incoming | Outgoing */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "incoming" && styles.activeFilterButton,
          ]}
          onPress={() => setActiveFilter("incoming")}
        >
          <Text
            style={[
              styles.filterButtonText,
              activeFilter === "incoming" && styles.activeFilterButtonText,
            ]}
          >
            Incoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "outgoing" && styles.activeFilterButton,
          ]}
          onPress={() => setActiveFilter("outgoing")}
        >
          <Text
            style={[
              styles.filterButtonText,
              activeFilter === "outgoing" && styles.activeFilterButtonText,
            ]}
          >
            Outgoing
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Rendering for Loading, Error, Empty, or Data */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008B8B" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.errorText}>
            {error.message || "Failed to load transactions. Please try again."}
          </Text>
        </View>
      ) : data && data.length > 0 ? (
        // Display transactions using FlatList
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TransactionItem item={item} currentUserId={user?.id} />
          )}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // Display message if no transactions are found for the active filter
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            No {activeFilter} transactions found.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center the title
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 + 10 : 10, // Adjusted as StatusBar.currentHeight is now implicit
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    position: "absolute", // Position it absolutely to the left
    left: 16,
    top: Platform.OS === "android" ? 10 + 10 : 10, // Adjusted as StatusBar.currentHeight is now implicit
    padding: 5, // Increase touch target
    zIndex: 1, // Ensure it's above the title if they overlap
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#008B8B",
    textAlign: "center", // Ensure title is centered
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden", // Ensures internal elements respect border radius
    borderWidth: 1,
    borderColor: "#B0C4C4",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFilterButton: {
    backgroundColor: "#008B8B",
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#008B8B",
  },
  activeFilterButtonText: {
    color: "#fff",
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20, // Add padding at the bottom for better scroll
  },
  transactionItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#B0C4C4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  transactionStatus: {
    fontSize: 14,
    fontWeight: "700",
  },
  transactionDetails: {
    fontSize: 13,
    color: "#555",
    marginBottom: 2,
  },
  boldText: {
    fontWeight: "600",
    color: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
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
    paddingHorizontal: 20,
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
});

export default TransactionsPage;
