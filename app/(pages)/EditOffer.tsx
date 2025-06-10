import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { selectImage } from "@/services/selectImage";
import { SelectList } from "react-native-dropdown-select-list";
import * as FileSystem from "expo-file-system";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CategoryFlatlist from "@/components/CategoryFlatlist";
import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams } from "expo-router";
import { Offer } from "../(tabs)";

type Category = {
  id: number;
  title: string;
};

const EditOffer = () => {
  const { offerId } = useLocalSearchParams();

  const { user: token } = useAuth();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number | null>(0);
  const [image, setImage] = useState<string>("");
  const [offerType, setOfferType] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [deliveryTime, setDeliveryTime] = useState<string>("");
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const categories = queryClient.getQueryData(["categories"]) as Category[];

  const {
    data: offer,
    error,
    isLoading: dataIsLoading,
  } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/offer/${offerId}`,
        {
          headers: { Authorization: `Bearer ${token} ` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const offerTypes = [
    { key: "1", value: "SKILL" },
    { key: "2", value: "SERVICE" },
    { key: "3", value: "ITEM" },
  ];

  const paymentMethods = [
    { key: "1", value: "SWAP" },
    { key: "2", value: "COIN" },
    { key: "3", value: "BOTH" },
  ];

  const handleSelectImage = async () => {
    const selectedImage = await selectImage();
    if (selectedImage) {
      setImage(selectedImage);
      setLocalImageUri(null);
    }
  };

  const removeImage = () => setImage("");

  const handleEditOffer = async () => {
    const offer = {
      id: offerId,
      title,
      description,
      price,
      type: offerType,
      paymentMethod,
      deliveryTime,
      categoryId,
    };

    const formData = new FormData();

    formData.append("offer", JSON.stringify(offer));

    console.log(paymentMethod);

    if (image) {
      const fileInfo = await FileSystem.getInfoAsync(image);
      if (fileInfo.exists) {
        const filename = image.split("/").pop() ?? "image.jpg";
        const ext = filename.split(".").pop()?.toLowerCase();
        const mimeType =
          ext === "png"
            ? "image/png"
            : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : "application/octet-stream";

        formData.append("image", {
          uri: image,
          name: filename,
          type: mimeType,
        } as any);
      }
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/offer/update`, // 👈 edit endpoint
        {
          method: "PUT", // or "PATCH" depending on your backend
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        const errorData = contentType?.includes("application/json")
          ? await response.json()
          : await response.text();

        console.error("Edit failed:", errorData);
        throw new Error(errorData?.error || "Failed to edit offer");
      }

      const data = await response.json();

      Alert.alert("Success", "Offer updated successfully!");

      queryClient.invalidateQueries({ queryKey: ["yourOffers"] });
      queryClient.invalidateQueries({ queryKey: ["offer", offerId] });
      // Optionally navigate or refresh data here
    } catch (error: any) {
      console.error("Error:", error.message);
      Alert.alert("Error", error.message || "Could not edit offer.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (offer) {
      setTitle(offer.title ?? "");
      setDescription(offer.description ?? "");
      setPrice(offer.price ?? 0);
      setImage(offer.image ?? "");
      setOfferType(offer.type ?? "");
      setPaymentMethod(offer.paymentMethod ?? "");
      setDeliveryTime(offer.deliveryTime?.toString() ?? "");
      setCategoryId(offer.categoryId ?? 0);
    }
  }, [offer]);

  useEffect(() => {
    const loadImage = async () => {
      if (!offer?.image) return;

      setIsLoading(true);
      try {
        const imageUrl = process.env.EXPO_PUBLIC_API_URL + offer.image;
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
  }, [offer, token]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView>
          <Text style={styles.header}>
            {offerType
              ? `Add your ${offerType.toLowerCase()} offer`
              : "What would you like to offer today?"}
          </Text>
          <View style={styles.form}>
            <Text style={styles.label}>Type of Offer</Text>

            <SelectList
              data={offerTypes}
              setSelected={(selectedKey: string) => {
                const selected = offerTypes.find(
                  (item) => item.key === selectedKey
                );
                setOfferType(selected?.value || "");
              }}
              defaultOption={
                offerTypes.find((type) => type.value === offerType) || {
                  key: "",
                  value: "",
                }
              }
            />

            <View style={{ height: 70, marginLeft: -10 }}>
              <CategoryFlatlist
                data={categories}
                setSelectedCategoryId={setCategoryId}
                selectedCategoryId={categoryId}
              />
            </View>
            <Text style={styles.label}>Image</Text>
            <View style={styles.imagesContainer}>
              {image ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={
                      localImageUri
                        ? { uri: localImageUri }
                        : image
                        ? { uri: image }
                        : require("@/assets/images/profile-pic-placeholder.png")
                    }
                    style={styles.image}
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={removeImage}
                  >
                    <FontAwesome
                      name="times-circle"
                      size={20}
                      color="#FF6B6B"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addImageBtn}
                  onPress={handleSelectImage}
                >
                  <FontAwesome name="plus" size={24} color="#008B8B" />
                  <Text style={styles.addImageText}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter title"
              placeholderTextColor="#888"
              onChangeText={setTitle}
              value={title}
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
              placeholderTextColor="gray"
              onChangeText={setDescription}
              value={description}
            />
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price in JOD"
              placeholderTextColor="gray"
              onChangeText={(val) => {
                const parsed = parseFloat(val);
                setPrice(!isNaN(parsed) ? parsed : 0);
              }}
              value={price.toString()}
            />
            <Text style={styles.label}>Delivery Time</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter delivery time in days"
              keyboardType="numeric"
              value={deliveryTime}
              placeholderTextColor={"gray"}
              onChangeText={setDeliveryTime}
            />
            <Text style={styles.label}>Payment Method</Text>
            <SelectList
              setSelected={(val: any) => setPaymentMethod(val)}
              data={paymentMethods}
              save="value"
              boxStyles={styles.input}
              fontFamily="Poppins_400Regular"
              placeholder="Select payment method"
              arrowicon={
                <FontAwesome
                  name="angle-down"
                  size={20}
                  color="#008B8B"
                  style={{ marginRight: 5 }}
                />
              }
              search={false}
              defaultOption={{ key: paymentMethod, value: paymentMethod }}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleEditOffer}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7",
  },
  header: {
    fontSize: 24,
    textAlign: "center",
    padding: 10,
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
  },
  form: {
    paddingBottom: 80,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  label: {
    fontSize: 18,
    color: "#008B8B",
    marginBottom: 10,
    fontFamily: "Poppins_700Bold",
  },
  input: {
    height: 50,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#B0C4C4",
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    color: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#008B8B",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  imagesContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  imageWrapper: {
    width: 100,
    height: 100,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#008B8B",
  },
  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: "#008B8B",
    borderStyle: "dashed",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 139, 139, 0.1)",
  },
  addImageText: {
    color: "#008B8B",
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
});

export default EditOffer;
