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
} from "react-native";
import React, { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { selectImage } from "@/services/selectImage";
import { SelectList } from "react-native-dropdown-select-list";
import * as FileSystem from "expo-file-system";
import { useQueryClient } from "@tanstack/react-query";
import CategoryFlatlist from "@/components/CategoryFlatlist";
import { useAuth } from "@/context/AuthContext";
import { useRevalidateQueries } from "@/hooks/useRevalidate";
import { useRouter } from "expo-router";

type Category = {
  id: number;
  title: string;
};

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
  const { revalidate } = useRevalidateQueries();

  const queryClient = useQueryClient();
  const router = useRouter();

  const categories = queryClient.getQueryData(["categories"]) as Category[];

  const offerTypes = [
    { key: "SKILL", value: "SKILL" },
    { key: "SERVICE", value: "SERVICE" },
    { key: "ITEM", value: "ITEM" },
  ];

  const paymentMethods = [
    { key: "SWAP", value: "SWAP" },
    { key: "COIN", value: "COIN" },
    { key: "BOTH", value: "BOTH" },
  ];

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

  const handleSelectImage = async () => {
    const selectedImage = await selectImage();
    if (selectedImage) {
      setImage(selectedImage);
    }
  };

  const removeImage = () => setImage(undefined);

  const handleAddOffer = async () => {
    if (
      !title ||
      !description ||
      price <= 0 ||
      !categoryId ||
      !offerType ||
      !paymentMethod ||
      !deliveryTime
    ) {
      showAlert(
        "Missing Information",
        "Please fill in all the required fields before submitting your offer. Image is optional."
      );
      return;
    }

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
        const filename = image.split("/").pop() ?? "image.jpg"; // Default to image.jpg
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
        let errorData: any;
        if (contentType?.includes("application/json")) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }

        console.error("Upload failed:", errorData);
        throw new Error(
          errorData?.error ||
            errorData?.message ||
            "Failed to add offer due to server issue."
        );
      }

      const data = await response.json();
      console.log("Offer added:", data);
      showAlert(
        "Offer Added",
        "Your offer has been successfully posted!",
        async () => {
          setTitle("");
          setDescription("");
          setPrice(0);
          setCategoryId(0);
          setImage(undefined);
          setOfferType("");
          setPaymentMethod("");
          setDeliveryTime("");

          await revalidate(categoryId ?? 0);
          router.replace("/(tabs)");
        }
      );
    } catch (error: any) {
      console.error("Error:", error.message);
      let userFriendlyMessage =
        "An unexpected error occurred. Please try again.";

      if (typeof error.message === "string" && error.message.length > 0) {
        if (
          error.message.includes("Failed to add offer") ||
          error.message.includes("server issue")
        ) {
          userFriendlyMessage =
            "We couldn't add your offer right now. Please try again in a moment.";
        } else if (error.message.includes("access token")) {
          userFriendlyMessage =
            "Your session has expired. Please log in again.";
        } else {
          userFriendlyMessage = error.message;
        }
      } else {
        userFriendlyMessage =
          "Could not add your offer. Please check your internet connection.";
      }

      showAlert("Submission Failed", userFriendlyMessage);
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
              defaultOption={offerTypes.find((opt) => opt.value === offerType)}
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
              onChangeText={(val) => setPrice(parseFloat(val))}
              keyboardType="numeric"
              value={price > 0 ? price.toString() : ""}
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
              defaultOption={paymentMethods.find(
                (opt) => opt.value === paymentMethod
              )}
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

// Styles for the custom modal
const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", // Semi-transparent background
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
    width: "80%",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  modalMessage: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
    fontFamily: "Poppins_400Regular",
  },
  okButton: {
    backgroundColor: "#20B2AA",
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    minWidth: 100,
    alignItems: "center",
  },
  okButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});

export default AddPost;
