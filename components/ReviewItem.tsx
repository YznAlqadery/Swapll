import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";

interface ReviewItemProps {
  review: {
    id: number;
    rating: number;
    comment: string;
    createdAt: string; // ISO string from backend
    offerId: number;
    firstName: string;
    lastName: string;
    userName: string;
    profilePicture?: string | null; // base64 or URI string
    userId: number;
  };
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
  return (
    <View style={styles.reviewItem}>
      <View style={styles.header}>
        {review.profilePicture ? (
          <Image
            source={{ uri: review.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <Ionicons name="person-circle-outline" size={40} color="#ccc" />
        )}
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{review.userName}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={uuidv4()}
                name={star <= review.rating ? "star" : "star-outline"}
                size={16}
                color={star <= review.rating ? "#FFA500" : "#CCC"}
              />
            ))}

            <Text
              style={{
                marginLeft: 4,
              }}
            >
              ({review.rating})
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.comment}>{review.comment}</Text>
      <Text style={styles.date}>
        {new Date(review.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewItem: {
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: "#F0FDFD",
    borderRadius: 10,
    borderColor: "#E0F0F0",
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
    borderWidth: 2,
    borderColor: "#008B8B",
  },
  userInfo: {
    marginLeft: 10,
  },
  username: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#008B8B",
  },
  ratingContainer: {
    flexDirection: "row",
    marginTop: 2,
  },
  comment: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginTop: 4,
    marginLeft: 50,
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: "#888",
  },
});

export default ReviewItem;
