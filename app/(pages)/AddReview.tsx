import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import Divider from "@/components/Divider";
import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

const AddReview = () => {
  const { offerId } = useLocalSearchParams();
  const { user: token } = useAuth();
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const queryClient = useQueryClient();

  const router = useRouter();

  const handleSubmit = async () => {
    console.log("Submitting reviewText:", reviewText, "rating:", rating);
    if (!reviewText || rating === 0) {
      Alert.alert("Please provide both a rating and a review.");
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
            offerId,
            rating,
            comment: reviewText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      await queryClient.invalidateQueries({
        queryKey: ["reviews", offerId] as const,
      });
      await queryClient.invalidateQueries({
        queryKey: ["offer", offerId] as const,
      });
      router.back();

      setReviewText("");

      setRating(0);
    } catch (error) {
      console.error(error);
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

export default AddReview;
