import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import * as FileSystem from "expo-file-system";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { fetchCategories, fetchOffersByCategory } from "../(tabs)";
import OfferCard from "@/components/OfferCard";
import ReviewItem from "@/components/ReviewItem";
import Divider from "@/components/Divider";

const saveBase64ToFile = async (base64String: string, filename: string) => {
  const fileUri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, base64String, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
};

async function fetchReviews(offerId: number, token: string) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/reviews/offer/${offerId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
}

const OfferDetails = () => {
  const { offerId } = useLocalSearchParams();
  const { user: token } = useAuth();
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const router = useRouter();

  const {
    data,
    error,
    isLoading: dataIsLoading,
  } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/offer/${offerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: categories, isLoading: categoriesIsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => fetchCategories(token as string),
    staleTime: 1000 * 60 * 5,
  });

  const { data: offersByCategory } = useQuery({
    queryKey: ["offers-by-category", data?.categoryId],
    queryFn: () =>
      fetchOffersByCategory(token as string, data?.categoryId as number),
    enabled: !!data?.categoryId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: reviews, isLoading: reviewsIsLoading } = useQuery({
    queryKey: ["reviews", offerId],
    queryFn: () => fetchReviews(data?.id as number, token as string),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const loadImage = async () => {
      if (!data?.image) return;

      setIsLoading(true);
      try {
        const imageUrl = process.env.EXPO_PUBLIC_API_URL + data.image;
        const localUri = `${FileSystem.cacheDirectory}temp-image.jpg`;

        const result = await FileSystem.downloadAsync(imageUrl, localUri, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLocalImageUri(result.uri);
        Image.getSize(result.uri, (w, h) => setImageAspectRatio(w / h));
      } catch (e) {
        console.log("Image loading error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [data, token]);

  useEffect(() => {
    const convertAndSave = async () => {
      if (data?.profilePic) {
        const uri = await saveBase64ToFile(
          data?.profilePic,
          `user-${data?.ownerId}.jpg`
        );
        setImageUri(uri);
      }
    };
    convertAndSave();
  }, [data?.profilePic]);

  if (isLoading || dataIsLoading || categoriesIsLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Failed to load offer.</Text>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <>
      <View style={styles.imageWrapper}>
        {localImageUri && imageAspectRatio ? (
          <Image
            source={{ uri: localImageUri }}
            style={{
              width: "100%",
              aspectRatio: imageAspectRatio,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}
          />
        ) : (
          <Image
            source={require("@/assets/images/no_image.jpeg")}
            style={{
              width: "100%",
              height: 350,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={styles.name}>{data.title}</Text>

          <View style={styles.userInfo}>
            <Image
              source={
                data.image
                  ? { uri: imageUri }
                  : require("@/assets/images/profile-pic-placeholder.png")
              }
              style={styles.profileImage}
            />
            <Text style={styles.username}>{data.username}</Text>
          </View>
        </View>
        <Text style={styles.subtext}>
          {categories?.find((cat: any) => cat.id === data?.categoryId)?.title} •{" "}
          {data?.paymentMethod == "BOTH" && "Allow Swap & Swapll Coin"}
          {data?.paymentMethod == "COIN" && "Swapll Coin"}
          {data?.paymentMethod == "SWAP" && "Allow Swap"}
        </Text>

        <View style={styles.row}>
          <Ionicons name="star" size={16} color="#FFA500" />
          <Text style={styles.rating}>
            {data?.averageRating} ({data?.numberOfReviews})
          </Text>
          <Text style={styles.label}>{data?.type}</Text>
        </View>

        <View style={[styles.row, { alignItems: "center", marginTop: 8 }]}>
          <FontAwesome
            name="truck"
            size={16}
            color="#008b8b"
            style={{ marginRight: 6 }}
          />
          {data?.deliveryTime > 2 ? (
            <Text
              style={[
                styles.meta,
                { fontSize: 14, color: "#333", fontWeight: "500" },
              ]}
            >
              {data.deliveryTime - 2}–{data.deliveryTime + 2} days •
            </Text>
          ) : (
            <Text
              style={[
                styles.meta,
                { fontSize: 14, color: "#008b8b", fontWeight: "500" },
              ]}
            >
              Very fast delivery •
            </Text>
          )}

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("@/assets/images/swapll_coin.png")}
              style={{ width: 24, height: 24, marginLeft: 4 }}
            />
            <Text style={styles.meta}>{data?.price}</Text>
          </View>
        </View>
        <View
          style={{ marginTop: 12, flexDirection: "row", alignItems: "center" }}
        >
          <FontAwesome
            name="calendar"
            size={16}
            color="#555"
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.meta,
              { fontSize: 14, color: "#555", fontWeight: "500" },
            ]}
          >
            {data?.createdAt &&
              new Date(data.createdAt).toLocaleDateString("en-CA")}
          </Text>
        </View>
        <View style={styles.descriptionBox}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Poppins_400Regular",
              color: "#008B8B",
            }}
          >
            {data?.description}
          </Text>
        </View>
      </View>

      <Divider />

      <Text style={styles.sectionTitle}>Picks for you 🔥</Text>
      <FlatList
        data={offersByCategory?.filter((item: any) => item.id !== data?.id)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <OfferCard
            id={item.id}
            title={item.title}
            price={item.price}
            image={item.image}
          />
        )}
        horizontal
      />
      {offersByCategory?.filter((item: any) => item.id !== data?.id).length ===
        0 && (
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              marginTop: 10,
              backgroundColor: "#F0FDFD",
              padding: 10,
              fontSize: 14,
              fontFamily: "Poppins_400Regular",
              color: "#008B8B",
            }}
          >
            No offers yet
          </Text>
        </View>
      )}
      <Divider />

      <Text style={styles.sectionTitle}>Reviews ({reviews?.length})</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {reviewsIsLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={reviews || []}
          keyExtractor={(item) => item.userId.toString()}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <ReviewItem
              username={item.userName}
              comment={item.comment}
              rating={item.rating}
              image={item.profilePicture}
              userId={item.userId}
            />
          )}
          ListEmptyComponent={
            <View
              style={{
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  marginTop: 10,
                  backgroundColor: "#F0FDFD",
                  padding: 10,
                  fontSize: 14,
                  fontFamily: "Poppins_400Regular",
                  color: "#008B8B",
                }}
              >
                No reviews yet
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoContainer: { padding: 16 },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  subtext: { color: "#777", marginTop: 4, fontFamily: "Poppins_400Regular" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  rating: { marginLeft: 4, fontWeight: "bold", color: "#444" },
  label: {
    marginLeft: 8,
    backgroundColor: "#E0FFFF",
    color: "#008B8B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  meta: { color: "#666", fontSize: 14, fontFamily: "Poppins_400Regular" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 8,
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  errorText: { color: "red", fontSize: 16, fontFamily: "Poppins_400Regular" },
  backButton: {
    position: "absolute",
    top: 5,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
  },
  descriptionBox: {
    backgroundColor: "#F0FDFD",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  username: {
    fontSize: 14,
    marginRight: 8,
    color: "#008B8B",
    fontFamily: "Poppins_600SemiBold",
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#008B8B",
  },
});

export default OfferDetails;
