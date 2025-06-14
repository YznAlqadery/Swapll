import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import { Feather } from "@expo/vector-icons";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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
  sellerName: string;
  buyerName: string;
  offerName: string;
}

interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  showConfirmButton?: boolean;
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  isVisible,
  title,
  message,
  onClose,
  onConfirm,
  showConfirmButton = false,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable
        style={modalStyles.centeredView}
        onPress={showConfirmButton ? undefined : onClose}
      >
        <View style={modalStyles.modalView}>
          <Text style={modalStyles.modalTitle}>{title}</Text>
          <Text style={modalStyles.modalMessage}>{message}</Text>
          {showConfirmButton && onConfirm ? (
            <View style={modalStyles.modalButtons}>
              <TouchableOpacity
                style={[modalStyles.modalButton, modalStyles.cancelButton]}
                onPress={onClose}
              >
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.modalButton, modalStyles.confirmButton]}
                onPress={() => {
                  onConfirm();
                }}
              >
                <Text style={modalStyles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={modalStyles.okButton} onPress={onClose}>
              <Text style={modalStyles.okButtonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
};

async function fetchApi<T>(
  url: string,
  token: string,
  method: string = "GET"
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorText;
    } catch (e) {}
    throw new Error(
      `Failed to ${method.toLowerCase()} ${url.split("/").pop()}: ${
        errorMessage || response.statusText
      }`
    );
  }
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

async function fetchOutgoingTransactions(
  token: string
): Promise<TransactionDTO[]> {
  return fetchApi<TransactionDTO[]>(
    `${API_BASE_URL}/api/transactions/outgoing`,
    token
  );
}

async function fetchIncomingTransactions(
  token: string
): Promise<TransactionDTO[]> {
  return fetchApi<TransactionDTO[]>(
    `${API_BASE_URL}/api/transactions/seller-transactions`,
    token
  );
}

async function acceptTransactionApi(
  token: string,
  transactionId: number
): Promise<void> {
  return fetchApi<void>(
    `${API_BASE_URL}/api/transactions/accept/${transactionId}`,
    token,
    "PUT"
  );
}

async function declineTransactionApi(
  token: string,
  transactionId: number
): Promise<void> {
  return fetchApi<void>(
    `${API_BASE_URL}/api/transactions/reject/${transactionId}`,
    token,
    "PUT"
  );
}

async function confirmTransactionApi(
  token: string,
  transactionId: number
): Promise<void> {
  return fetchApi<void>(
    `${API_BASE_URL}/api/transactions/complete/${transactionId}`,
    token,
    "PUT"
  );
}

interface TransactionItemProps {
  item: TransactionDTO;
  currentUserId: number | undefined;
  onAccept: (transactionId: number) => void;
  onReject: (transactionId: number) => void;
  onConfirm: (transactionId: number) => void;
  isAccepting: boolean;
  isRejecting: boolean;
  isConfirming: boolean;
}

const TransactionItem = React.memo(
  ({
    item,
    currentUserId,
    onAccept,
    onReject,
    onConfirm,
    isAccepting,
    isRejecting,
    isConfirming,
  }: TransactionItemProps) => {
    const isBuyer = currentUserId === item.buyerId;
    const isSeller = currentUserId === item.sellerId;

    const roleText = isBuyer ? "Buyer" : isSeller ? "Seller" : "Participant";

    const statusColor =
      item.status === TransactionStatus.COMPLETED
        ? "#20B2AA"
        : item.status === TransactionStatus.DECLINED
        ? "#B22222"
        : item.status === TransactionStatus.ACTIVE
        ? "#008000"
        : "#FFA500";

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionTitle}>Offer: {item.offerName}</Text>
          <Text style={[styles.transactionStatus, { color: statusColor }]}>
            {item.status.replace("_", " ")}
          </Text>
        </View>
        <Text style={styles.transactionDetails}>
          Your Role: <Text style={styles.boldText}>{roleText}</Text>
        </Text>
        <Text style={styles.transactionDetails}>
          Buyer: <Text style={styles.boldText}>{item.buyerName}</Text>
        </Text>
        <Text style={styles.transactionDetails}>
          Seller: <Text style={styles.boldText}>{item.sellerName}</Text>
        </Text>
        <Text style={styles.transactionDetails}>
          Initiated:{" "}
          <Text style={styles.boldText}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </Text>

        {(item.status === TransactionStatus.ACTIVE ||
          item.status === TransactionStatus.COMPLETED) && (
          <>
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
          </>
        )}

        <View style={styles.actionButtonsContainer}>
          {isSeller && item.status === TransactionStatus.PENDING && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => onAccept(item.id)}
                disabled={isAccepting || isRejecting || isConfirming}
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Accept</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => onReject(item.id)}
                disabled={isAccepting || isRejecting || isConfirming}
              >
                {isRejecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {item.status === TransactionStatus.ACTIVE &&
            ((isBuyer && !item.buyerConfirmed) ||
              (isSeller && !item.sellerConfirmed)) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmActiveButton]}
                onPress={() => onConfirm(item.id)}
                disabled={isAccepting || isRejecting || isConfirming}
              >
                {isConfirming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            )}
        </View>
      </View>
    );
  }
);

const TransactionsPage = () => {
  const router = useRouter();
  const { user: token } = useAuth();
  const { user } = useLoggedInUser();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<"incoming" | "outgoing">(
    "incoming"
  );

  const [loadingTransactionId, setLoadingTransactionId] = useState<
    number | null
  >(null);
  const [actionType, setActionType] = useState<
    "accept" | "reject" | "confirm" | null
  >(null);

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<
    (() => void) | undefined
  >(undefined);
  const [showAlertConfirmButton, setShowAlertConfirmButton] = useState(false);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      onConfirm?: () => void,
      showConfirmButton: boolean = false
    ) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertOnConfirm(() => onConfirm);
      setShowAlertConfirmButton(showConfirmButton);
      setIsAlertVisible(true);
    },
    []
  );

  const hideAlert = useCallback(() => {
    setIsAlertVisible(false);
    setAlertTitle("");
    setAlertMessage("");
    setAlertOnConfirm(undefined);
    setShowAlertConfirmButton(false);
  }, []);

  const performTransactionAction = useCallback(
    async (
      transactionId: number,
      action: "accept" | "reject" | "confirm",
      apiCall: (token: string, id: number) => Promise<void>,
      successMessage: string,
      confirmTitle: string,
      confirmMessage: string
    ) => {
      if (!token) {
        showAlert(
          "Error",
          "Authentication token missing. Please log in again."
        );
        return;
      }

      showAlert(
        confirmTitle,
        confirmMessage,
        async () => {
          setLoadingTransactionId(transactionId);
          setActionType(action);
          try {
            await apiCall(token, transactionId);

            await queryClient.invalidateQueries({
              queryKey: ["incomingTransactions", user?.id],
            });
            await queryClient.invalidateQueries({
              queryKey: ["outgoingTransactions", user?.id],
            });

            if (action === "confirm") {
              await queryClient.invalidateQueries({
                queryKey: ["loggedInUser"],
              });
            }

            showAlert("Success", successMessage, hideAlert);
          } catch (err: any) {
            showAlert(
              "Error",
              err.message || `Failed to ${action} transaction.`,
              hideAlert
            );
          } finally {
            setLoadingTransactionId(null);
            setActionType(null);
          }
        },
        true
      );
    },
    [token, user?.id, queryClient, showAlert, hideAlert]
  );

  const handleAccept = useCallback(
    (transactionId: number) => {
      performTransactionAction(
        transactionId,
        "accept",
        acceptTransactionApi,
        "Transaction accepted successfully!",
        "Confirm Acceptance",
        "Are you sure you want to accept this transaction?"
      );
    },
    [performTransactionAction]
  );

  const handleReject = useCallback(
    (transactionId: number) => {
      performTransactionAction(
        transactionId,
        "reject",
        declineTransactionApi,
        "Transaction declined successfully!",
        "Confirm Rejection",
        "Are you sure you want to decline this transaction? This action cannot be undone."
      );
    },
    [performTransactionAction]
  );

  const handleConfirm = useCallback(
    (transactionId: number) => {
      performTransactionAction(
        transactionId,
        "confirm",
        confirmTransactionApi,
        "Transaction confirmed successfully!",
        "Confirm Transaction Completion",
        "By confirming, you acknowledge that the transaction for this offer is complete and successful. This action cannot be undone."
      );
    },
    [performTransactionAction]
  );

  const {
    data: incomingTransactions,
    isLoading: incomingLoading,
    error: incomingError,
    isRefetching: isRefetchingIncoming,
    refetch: refetchIncoming,
  } = useQuery<TransactionDTO[]>({
    queryKey: ["incomingTransactions", user?.id],
    queryFn: () => fetchIncomingTransactions(token as string),
    enabled: activeFilter === "incoming" && !!user?.id && !!token,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: outgoingTransactions,
    isLoading: outgoingLoading,
    error: outgoingError,
    isRefetching: isRefetchingOutgoing,
    refetch: refetchOutgoing,
  } = useQuery<TransactionDTO[]>({
    queryKey: ["outgoingTransactions", user?.id],
    queryFn: () => fetchOutgoingTransactions(token as string),
    enabled: activeFilter === "outgoing" && !!user?.id && !!token,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    activeFilter === "incoming" ? incomingLoading : outgoingLoading;
  const error = activeFilter === "incoming" ? incomingError : outgoingError;
  const data =
    activeFilter === "incoming" ? incomingTransactions : outgoingTransactions;

  const isRefreshing =
    activeFilter === "incoming" ? isRefetchingIncoming : isRefetchingOutgoing;

  const handleRefresh = useCallback(() => {
    if (activeFilter === "incoming") {
      refetchIncoming();
    } else {
      refetchOutgoing();
    }
  }, [activeFilter, refetchIncoming, refetchOutgoing]);

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008B8B" />
          <Text style={styles.loadingText}>Loading user ID...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrapper}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#008B8B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "incoming" && styles.activeFilterButton,
          ]}
          onPress={() => setActiveFilter("incoming")}
          disabled={isLoading}
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
          disabled={isLoading}
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

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008B8B" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.errorText}>
            {error.message || "Failed to load transactions. Please try again."}
          </Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data && data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              currentUserId={user?.id}
              onAccept={handleAccept}
              onReject={handleReject}
              onConfirm={handleConfirm}
              isAccepting={
                loadingTransactionId === item.id && actionType === "accept"
              }
              isRejecting={
                loadingTransactionId === item.id && actionType === "reject"
              }
              isConfirming={
                loadingTransactionId === item.id && actionType === "confirm"
              }
            />
          )}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            No {activeFilter} transactions found.
          </Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tap to Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      <CustomAlertModal
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={hideAlert}
        onConfirm={alertOnConfirm}
        showConfirmButton={showAlertConfirmButton}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: Platform.OS === "android" ? 40 : 10,
    padding: 5,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
    textAlign: "center",
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#B0C4C4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontFamily: "Poppins_600SemiBold",
    color: "#008B8B",
  },
  activeFilterButtonText: {
    color: "#fff",
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 5,
  },
  transactionItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  transactionTitle: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    flexShrink: 1,
  },
  transactionStatus: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    marginLeft: 10,
    textTransform: "uppercase",
  },
  transactionDetails: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#555",
    marginBottom: 4,
  },
  boldText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#222",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#F0F7F7",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#008B8B",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#F0F7F7",
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#777",
    marginTop: 20,
  },
  errorText: {
    color: "#D32F2F",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    marginTop: 20,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: "#008B8B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
    paddingTop: 10,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
    minWidth: 100,
  },
  acceptButton: {
    backgroundColor: "#20B2AA",
  },
  rejectButton: {
    backgroundColor: "#B22222",
  },
  confirmActiveButton: {
    backgroundColor: "#008B8B",
  },
  actionButtonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
  },
  modalMessage: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  okButton: {
    backgroundColor: "#008B8B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 2,
    minWidth: 120,
    alignItems: "center",
  },
  okButtonText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  confirmButton: {
    backgroundColor: "#20B2AA",
  },
  cancelButtonText: {
    color: "#555",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
  confirmButtonText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
});

export default TransactionsPage;
