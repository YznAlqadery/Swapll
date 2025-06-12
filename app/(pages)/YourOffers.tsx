import { useAuth } from "@/context/AuthContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Offer } from "../(tabs)";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Modal from "react-native-modal";
import SkeletonOfferItem from "@/components/SkeletonOfferItem";

async function fetchOffers(userId: number, token: string) {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offers/user/${userId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch your offers");
  }

  return await response.json();
}

async function handleDelete(offerId: number, token: string) {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/offer/${offerId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to delete offer");
  }
}

const YourOffers = () => {
  const { user: token } = useAuth();
  const { user } = useLoggedInUser();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useLocalSearchParams();
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const MainId = userId ?? user?.id;
  const offersQueryKey = ["yourOffers", MainId];

  const {
    data: yourOffers,
    isLoading: yourOffersLoading,
    error: yourOffersError,
  } = useQuery({
    queryKey: offersQueryKey,
    queryFn: () => fetchOffers(Number(MainId), token as string),
    enabled: !!user && !!MainId,
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (offerId: number) => handleDelete(offerId, token as string),
    onMutate: async (offerId: number) => {
      await queryClient.cancelQueries({ queryKey: offersQueryKey });

      const previousData = queryClient.getQueryData<Offer[]>(offersQueryKey);

      queryClient.setQueryData<Offer[]>(offersQueryKey, (old = []) =>
        old.filter((offer) => Number(offer.id) !== offerId)
      );

      return { previousData };
    },
    onError: (err, offerId, context) => {
      queryClient.setQueryData(offersQueryKey, context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: offersQueryKey });
    },
  });

  const openDeleteModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    setSelectedOffer(null);
    setIsDeleteModalVisible(false);
  };

  const confirmDelete = () => {
    if (selectedOffer) {
      deleteOfferMutation.mutate(Number(selectedOffer.id));
      closeDeleteModal();
    }
  };

  const RenderOffer = ({ item }: { item: Offer }) => (
    <TouchableOpacity
      style={styles.offerItem}
      onPress={() =>
        router.push({
          pathname: "/(pages)/OfferDetails",
          params: { offerId: item.id },
        })
      }
    >
      <View style={styles.offerImageContainer}>
        <Image
          source={
            item.image
              ? { uri: item.image }
              : require("@/assets/images/no_image.jpeg")
          }
          style={styles.offerImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.offerDetails}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.username}>by {item.username}</Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.priceButtonsRow}>
          <View style={styles.priceContainer}>
            <Image
              style={styles.coin}
              source={require("@/assets/images/swapll_coin.png")}
            />
            <Text style={styles.price}>{item.price}</Text>
          </View>

          {userId == null && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  router.push({
                    pathname: "/(pages)/EditOffer",
                    params: { offerId: item.id },
                  })
                }
              >
                <Feather name="edit" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => openDeleteModal(item)}
              >
                <FontAwesome5 name="trash-alt" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#008B8B" />
          </TouchableOpacity>
          <Text style={styles.header}>
            {userId == null ? "Your Offers" : "His Offers"}
          </Text>
        </View>

        {yourOffersLoading && (
          <>
            <SkeletonOfferItem />
            <SkeletonOfferItem />
            <SkeletonOfferItem />
          </>
        )}

        {yourOffersError && (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: "#008b8b", textAlign: "center" }}>
              You have no offers, start by adding some!
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(tabs)/add")}
            >
              <Text style={styles.addButtonText}>Add Offer</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={yourOffers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={RenderOffer}
          contentContainerStyle={styles.listContainer}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          isVisible={isDeleteModalVisible}
          onBackdropPress={closeDeleteModal}
          animationIn="zoomIn"
          animationOut="zoomOut"
          backdropOpacity={0.5}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{selectedOffer?.title}"?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeDeleteModal}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  listContainer: { padding: 10 },
  offerImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
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
    alignSelf: "center",
    marginVertical: 10,
  },
  title: {
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  username: {
    color: "#666",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    marginBottom: 4,
  },
  description: {
    color: "#008B8B",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#E0FFFF",
    padding: 6,
    borderRadius: 8,
  },
  coin: {
    width: 25,
    height: 25,
    marginRight: 4,
    borderRadius: 50,
  },
  price: {
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
    gap: 10,
    marginLeft: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#20B2AA",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B22222",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 10,
    zIndex: 1,
  },
  headerContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  priceButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 6,
  },
  addButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#008B8B",
    borderRadius: 8,
    marginBottom: 20,
    borderColor: "#008B8B",
    borderWidth: 1,
  },
  addButtonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
  },
  // Modal styles
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#B22222",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 20,
    color: "#444",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ddd",
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#B22222",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
});

export default YourOffers;
