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
import React, { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { selectImage } from "@/services/selectImage";
import { SelectList } from "react-native-dropdown-select-list";
import * as FileSystem from "expo-file-system";
import { useQueryClient } from "@tanstack/react-query";
import CategoryFlatlist from "@/components/CategoryFlatlist";
import { useAuth } from "@/context/AuthContext";

type Category = {
  id: number;
  title: string;
};

const AddPost = () => {
  const { user: token } = useAuth();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number | null>(0);
  const [image, setImage] = useState<string>();
  const [offerType, setOfferType] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [deliveryTime, setDeliveryTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const categories = queryClient.getQueryData(["categories"]) as Category[];

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
    }
  };

  const removeImage = () => setImage(undefined);

  const handleAddOffer = async () => {
    // Replace these with your actual state variables
    const offer = {
      title,
      description,
      price,
      type: offerType,
      paymentMethod,
      deliveryTime,
      categoryId,
    };

    const formData = new FormData();

    // Append offer JSON as string
    formData.append("offer", JSON.stringify(offer));

    // Append image if exists
    if (image) {
      const fileInfo = await FileSystem.getInfoAsync(image);
      if (fileInfo.exists) {
        const filename = image.split("/").pop() ?? "profile.jpg";
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
        `${process.env.EXPO_PUBLIC_API_URL}/api/offer/add`,
        {
          method: "POST",
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

        console.error("Upload failed:", errorData);
        throw new Error(errorData?.error || "Failed to add offer");
      }

      const data = await response.json();
      console.log("Offer added:", data);
      Alert.alert("Success", "Offer added successfully!");
      // Do something like reset form or navigate
    } catch (error: any) {
      console.error("Error:", error.message);
      Alert.alert("Error", error.message || "Could not add offer.");
    } finally {
      setIsLoading(false);
    }
  };

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
              setSelected={(val: any) => setOfferType(val)}
              data={offerTypes}
              save="value"
              fontFamily="Poppins_400Regular"
              boxStyles={styles.input}
              placeholder="Select offer type"
              arrowicon={
                <FontAwesome
                  name="angle-down"
                  size={20}
                  color="#008B8B"
                  style={{ marginRight: 5 }}
                />
              }
              search={false}
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
                  <Image source={{ uri: image }} style={styles.image} />
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
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
              placeholderTextColor="gray"
              onChangeText={setDescription}
            />
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price in JOD"
              placeholderTextColor="gray"
              onChangeText={(val) => setPrice(parseFloat(val))}
            />
            <Text style={styles.label}>Delivery Time</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter delivery time (e.g. 2 days)"
              placeholderTextColor="gray"
              value={deliveryTime}
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
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleAddOffer}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Adding..." : "Add"}
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

export default AddPost;
