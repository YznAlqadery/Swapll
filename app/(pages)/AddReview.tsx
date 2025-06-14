import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Modal, // Import Modal
  Pressable, // Import Pressable for modal overlay
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import Divider from "@/components/Divider";
import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

// --- Custom Alert Modal Component (Copied from OfferDetails.tsx) ---
interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void; // Optional callback for "OK" button
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
      animationType="fade" // Or "slide"
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

const AddReview = () => {
  const { offerId } = useLocalSearchParams<{ offerId: string }>(); // Explicitly type offerId as string
  const { user: token } = useAuth();
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const queryClient = useQueryClient();

  const router = useRouter();

  // --- State for Custom Alert Modal ---
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
    setAlertOnConfirm(() => onConfirm); // Set the function for the callback
    setIsAlertVisible(true);
  };

  const hideAlert = () => {
    setIsAlertVisible(false);
    setAlertTitle("");
    setAlertMessage("");
    setAlertOnConfirm(undefined);
  };

  const handleSubmit = async () => {
    console.log("Submitting reviewText:", reviewText, "rating:", rating);
    if (!reviewText || rating === 0) {
      showAlert(
        "Missing Information",
        "Please provide both a rating and a review."
      );
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/review/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            offerId: parseInt(offerId as string), // Ensure offerId is a number for the API call
            rating,
            comment: reviewText,
          }),
        }
      );

      if (!response.ok) {
        // Attempt to read the error message from the response body
        const errorData = await response.text();
        let errorMessage = "Failed to submit review. Please try again.";
        try {
          const parsedError = JSON.parse(errorData);
          if (parsedError.message) {
            errorMessage = parsedError.message; // Use backend's specific error message
          }
        } catch (parseError) {
          // If response is not JSON, use the raw text or default message
          errorMessage = errorData || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Invalidate queries to trigger refetch on OfferDetails page
      await queryClient.invalidateQueries({
        queryKey: ["reviews", parseInt(offerId as string)],
      });
      await queryClient.invalidateQueries({
        queryKey: ["offer", parseInt(offerId as string)],
      });

      showAlert("Success", "Your review has been added!", () => {
        router.back(); // Navigate back to the OfferDetails page
        setReviewText("");
        setRating(0);
      });
    } catch (error: any) {
      console.error("Error submitting review:", error);
      showAlert(
        "Submission Error",
        error.message ||
          "An unexpected error occurred while submitting your review."
      );
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <TouchableOpacity key={`star-${i}`} onPress={() => setRating(i + 1)}>
        <FontAwesome
          name={i < rating ? "star" : "star-o"}
          size={30}
          color="#FFD700"
          style={styles.star}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, padding: 20 }}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#008b8b" />
          </TouchableOpacity>
          <Text style={styles.heading}>Add Your Review</Text>
        </View>

        <Divider />

        <Text style={styles.label}>Rating:</Text>
        <View style={styles.starsContainer}>{renderStars()}</View>

        <Text style={styles.label}>Review:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          value={reviewText}
          onChangeText={setReviewText}
          placeholder="Write your review..."
          placeholderTextColor="#999"
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>

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
    padding: 20,
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    flex: 1,
    color: "#008b8b",
    marginLeft: -20,
  },
  label: {
    marginTop: 10,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  star: {
    marginRight: 5,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    fontFamily: "Poppins_400Regular",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#008b8b",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: "#008b8b",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Poppins_600SemiBold",
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)", // Slightly darker overlay
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 15, // Slightly less rounded
    padding: 30, // Reduced padding
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4, // Stronger shadow
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: "85%", // Slightly wider modal
    borderWidth: 1, // Subtle border
    borderColor: "#E0FFFF",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 22, // Larger title
    fontWeight: "bold",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  modalMessage: {
    marginBottom: 25, // More space
    textAlign: "center",
    fontSize: 16,
    color: "#555", // Slightly softer black
    fontFamily: "Poppins_400Regular",
    lineHeight: 22, // Better line height
  },
  okButton: {
    backgroundColor: "#20B2AA",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25, // Wider button
    elevation: 3,
    minWidth: 120, // Minimum width
    alignItems: "center",
    shadowColor: "#000", // Shadow for button
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  okButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 17, // Slightly larger text
    fontFamily: "Poppins_600SemiBold",
  },
});

export default AddReview;
