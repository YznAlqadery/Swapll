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
  Modal,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { selectImage } from "@/services/selectImage";
import { SelectList } from "react-native-dropdown-select-list";
import * as FileSystem from "expo-file-system";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CategoryFlatlist from "@/components/CategoryFlatlist";
import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";

type Category = {
  id: number;
  title: string;
};

// Custom Alert Modal component
interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void; // Optional confirm action
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

const EditOffer = () => {
  const { offerId } = useLocalSearchParams();

  const { user: token } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number | null>(0);
  const [image, setImage] = useState<string>(""); // For displaying the image (can be S3 URL or local URI)
  const [newLocalImageUri, setNewLocalImageUri] = useState<string | null>(null); // Only for newly selected local image for upload
  const [offerType, setOfferType] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [deliveryTime, setDeliveryTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<
    (() => void) | undefined
  >(undefined);

  const queryClient = useQueryClient();

  const categories = queryClient.getQueryData(["categories"]) as Category[];

  const {
    data: offer,
    error: offerError,
    isLoading: offerDataLoading,
  } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/offer/${offerId}`,
        {
          headers: { Authorization: `Bearer ${token} ` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch offer");
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!token && !!offerId, // Only run if token and offerId exist
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

  // Callback to show custom alert
  const showAlert = useCallback(
    (title: string, message: string, onConfirm?: () => void) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertOnConfirm(() => onConfirm);
      setIsAlertVisible(true);
    },
    []
  );

  // Callback to hide custom alert
  const hideAlert = useCallback(() => {
    setIsAlertVisible(false);
    setAlertTitle("");
    setAlertMessage("");
    setAlertOnConfirm(undefined);
  }, []);

  const handleSelectImage = async () => {
    const selectedImageUri = await selectImage(); // This should return a file:// URI
    if (selectedImageUri) {
      setImage(selectedImageUri); // Update for display
      setNewLocalImageUri(selectedImageUri); // Store the local URI for upload
    }
  };

  const removeImage = () => {
    setImage(""); // Clear displayed image
    setNewLocalImageUri(null); // Clear the local URI for upload, signaling removal
  };

  const handleEditOffer = async () => {
    Keyboard.dismiss(); // Dismiss the keyboard
    setErrors({}); // Clear previous errors
    let hasError = false;
    const newErrors: { [key: string]: string } = {};

    // --- Validation Checks ---
    if (!offerType) {
      newErrors.offerType = "Offer type is required.";
      hasError = true;
    }
    if (categoryId === null || categoryId === 0) {
      newErrors.categoryId = "Category is required.";
      hasError = true;
    }
    if (!title.trim()) {
      newErrors.title = "Title is required.";
      hasError = true;
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
      hasError = true;
    }
    if (!description.trim()) {
      newErrors.description = "Description is required.";
      hasError = true;
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters.";
      hasError = true;
    }
    if (price <= 0) {
      newErrors.price = "Price must be a positive number.";
      hasError = true;
    }
    // Validate deliveryTime as a positive number
    if (!deliveryTime.trim()) {
      newErrors.deliveryTime = "Delivery time is required.";
      hasError = true;
    } else if (isNaN(parseInt(deliveryTime)) || parseInt(deliveryTime) <= 0) {
      newErrors.deliveryTime = "Delivery time must be a positive number.";
      hasError = true;
    }
    if (!paymentMethod) {
      newErrors.paymentMethod = "Payment method is required.";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      showAlert(
        "Validation Error",
        "Please fill in all required fields correctly."
      );
      return;
    }

    const currentOfferData: any = {
      id: offerId,
      title,
      description,
      price,
      type: offerType,
      paymentMethod,
      deliveryTime: parseInt(deliveryTime),
      categoryId,
    };

    const formData = new FormData();
    formData.append("offer", JSON.stringify(currentOfferData));

    // Image handling logic:
    if (newLocalImageUri) {
      // Case 1: A new local image was selected
      try {
        const fileInfo = await FileSystem.getInfoAsync(newLocalImageUri);
        if (fileInfo.exists && fileInfo.uri) {
          const filename = fileInfo.uri.split("/").pop() ?? "image.jpg";
          const ext = filename.split(".").pop()?.toLowerCase();
          const mimeType =
            ext === "png"
              ? "image/png"
              : ext === "jpg" || ext === "jpeg"
              ? "image/jpeg"
              : "application/octet-stream";

          formData.append("image", {
            uri: fileInfo.uri,
            name: filename,
            type: mimeType,
          } as any);
        } else {
          showAlert("Image Error", "Selected image file not found or invalid.");
          return;
        }
      } catch (fileError: any) {
        showAlert(
          "Image Error",
          `Error processing image: ${fileError.message}`
        );
        return;
      }
    } else if (!image && offer?.image) {
      // Case 2: User explicitly removed the existing S3 image (image state is empty, but offer had an image)
      currentOfferData.image = ""; // Signal to backend to remove the image
      formData.set("offer", JSON.stringify(currentOfferData)); // Update the offer JSON in FormData
    } else if (image && image.startsWith("http") && offer?.image) {
      // Case 3: User kept the original S3 image (image state holds S3 URL, no new local image)
      currentOfferData.image = image; // Keep the original S3 URL
      formData.set("offer", JSON.stringify(currentOfferData)); // Update the offer JSON in FormData
    }
    // Case 4: If 'image' is empty and 'offer.image' was also empty, no image field is appended for update.
    // This implies no image exists and no new image is being added.

    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/offer/update`,
        {
          method: "PUT",
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

        showAlert("Error", errorData?.error || "Failed to edit offer");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["yourOffers"] });
      queryClient.invalidateQueries({ queryKey: ["offer", offerId] });

      showAlert("Success", "Offer updated successfully!", () => router.back());
    } catch (error: any) {
      showAlert("Error", error.message || "Could not edit offer.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (offer) {
      setTitle(offer.title ?? "");
      setDescription(offer.description ?? "");
      setPrice(offer?.price ?? 0); // Price initialized directly from offer data
      setImage(offer.image ?? "");
      setNewLocalImageUri(null); // Reset new local image state when offer loads
      setOfferType(offer.type ?? "");
      setPaymentMethod(offer.paymentMethod ?? "");
      setDeliveryTime(offer.deliveryTime?.toString() ?? "");
      setCategoryId(offer.categoryId ?? 0);
    }
  }, [offer]);

  // Loading and error states for data fetching
  if (offerDataLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008B8B" />
        <Text style={styles.loadingText}>
          Loading offer details and categories...
        </Text>
      </SafeAreaView>
    );
  }

  if (offerError) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Error loading: {offerError?.message || "Unknown error"}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }} // Ensure KeyboardAvoidingView takes full height
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#008B8B" />
            </TouchableOpacity>
            <Text style={styles.header}>
              {offerType
                ? `Edit your ${offerType.toLowerCase()} offer`
                : "Edit Offer"}
            </Text>
            {/* Placeholder to balance the header title if needed for centering */}
            <View style={styles.backButtonPlaceholder} />
          </View>

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
                offerTypes.find((type) => type.value === offerType) || undefined
              }
              boxStyles={{
                ...styles.input,
                ...(errors.offerType ? styles.inputError : {}),
              }}
              fontFamily="Poppins_400Regular"
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
            {errors.offerType ? (
              <Text style={styles.errorFieldText}>{errors.offerType}</Text>
            ) : null}

            <View
              style={{
                height: 70,

                marginBottom: 40,
                marginTop: -10,
              }}
            >
              <Text style={[styles.label, { marginTop: 20 }]}>Category</Text>
              <View
                style={{
                  height: 70,
                  marginLeft: -20,
                }}
              >
                <CategoryFlatlist
                  data={categories} // Pass fetched categories
                  setSelectedCategoryId={setCategoryId}
                  selectedCategoryId={categoryId}
                />
              </View>
              {errors.categoryId ? (
                <Text style={styles.errorFieldText}>{errors.categoryId}</Text>
              ) : null}
            </View>

            <Text style={[styles.label, { marginTop: 20 }]}>Image</Text>
            <View style={styles.imagesContainer}>
              {image ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: image }} // Use `image` state for display
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
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="Enter title"
              placeholderTextColor="#888"
              onChangeText={setTitle}
              value={title}
            />
            {errors.title ? (
              <Text style={styles.errorFieldText}>{errors.title}</Text>
            ) : null}

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.description && styles.inputError,
              ]}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
              placeholderTextColor="gray"
              onChangeText={setDescription}
              value={description}
            />
            {errors.description ? (
              <Text style={styles.errorFieldText}>{errors.description}</Text>
            ) : null}

            <Text style={styles.label}>Price</Text>
            <TextInput
              style={[styles.input, errors.price && styles.inputError]}
              placeholder="Enter price in JOD"
              placeholderTextColor="gray"
              onChangeText={(val) => {
                const parsed = parseFloat(val);
                setPrice(!isNaN(parsed) ? parsed : 0);
              }}
              value={price.toString()}
              keyboardType="numeric"
            />
            {errors.price ? (
              <Text style={styles.errorFieldText}>{errors.price}</Text>
            ) : null}

            <Text style={styles.label}>Delivery Time</Text>
            <TextInput
              style={[styles.input, errors.deliveryTime && styles.inputError]}
              placeholder="Enter delivery time in days"
              keyboardType="numeric"
              value={deliveryTime}
              placeholderTextColor={"gray"}
              onChangeText={setDeliveryTime}
            />
            {errors.deliveryTime ? (
              <Text style={styles.errorFieldText}>{errors.deliveryTime}</Text>
            ) : null}

            <Text style={styles.label}>Payment Method</Text>
            <SelectList
              setSelected={(val: any) => setPaymentMethod(val)}
              data={paymentMethods}
              save="value"
              boxStyles={{
                ...styles.input,
                ...(errors.paymentMethod ? styles.inputError : {}),
              }}
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
              defaultOption={
                paymentMethods.find(
                  (method) => method.value === paymentMethod
                ) || undefined
              }
            />
            {errors.paymentMethod ? (
              <Text style={styles.errorFieldText}>{errors.paymentMethod}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={handleEditOffer}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? <ActivityIndicator color="#fff" /> : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert Modal */}
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
    fontFamily: "Poppins_500Medium",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    padding: 20,
  },
  // New style for header row to accommodate back button
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: Platform.OS === "android" ? 20 : 0, // Adjust for Android SafeArea
  },
  backButton: {
    padding: 10,
  },
  header: {
    fontSize: 24,
    flex: 1, // Allows the text to take up available space, pushing buttons to sides
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
  },
  backButtonPlaceholder: {
    width: 24 + 20, // Match the width of the back button (icon size + padding) for centering
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
  inputError: {
    borderColor: "#FF6B6B", // Red border for error
  },
  errorFieldText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    fontFamily: "Poppins_400Regular",
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
  scrollContent: {
    paddingBottom: 80, // Add padding to ensure content is not hidden by keyboard on scroll
  },
});

// Styles for the custom alert modal
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

export default EditOffer;
