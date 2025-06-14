// app/(tabs)/messages.tsx
import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useChatInbox } from "@/hooks/useChatInbox";
import { Feather } from "@expo/vector-icons";

const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return "";
  const date = new Date(timeString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`; // Less than 24 hours
  if (diffMinutes < 10080) {
    // Less than 7 days
    const diffDays = Math.floor(diffMinutes / 1440);
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const Messages: React.FC = () => {
  const { chats, isLoading, error, isRefetching, refetch } = useChatInbox();
  const router = useRouter();

  const onPressMessage = (chat: any) => {
    router.push({
      pathname: "/(pages)/ChatPage",
      params: {
        userId: chat.otherUserId?.toString() ?? "",
        userName: chat.otherUsername ?? "",
        profilePic: chat.otherPicture ?? "",
      },
    });
  };

  // Render function for each item in the FlatList
  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.messageBox}
      onPress={() => onPressMessage(item)}
    >
      <View style={styles.messageHeader}>
        <View style={styles.profileContainer}>
          <Image
            source={
              item.otherPicture
                ? { uri: item.otherPicture }
                : require("@/assets/images/profile-pic-placeholder.png")
            }
            style={styles.profileImage}
          />
          <Text style={styles.sender}>
            {item.otherUsername || "Unknown User"}
          </Text>
        </View>
        <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
      </View>
      <Text style={styles.lastMessagePreview} numberOfLines={1}>
        {item.lastMessage || "No messages yet"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <TouchableOpacity
          style={styles.transactionsButton}
          onPress={() => router.push("/(pages)/TransactionPage")}
        >
          <Text style={styles.transactionsButtonText}>Transactions</Text>
          <Feather name="arrow-right" size={16} color="#008B8B" />
        </TouchableOpacity>
      </View>

      {isLoading && !isRefetching ? (
        <ActivityIndicator
          size="large"
          color="#008B8B"
          style={styles.loadingIndicator}
        />
      ) : error ? (
        <Text style={styles.errorText}>
          {typeof error === "string" ? error : "Failed to load conversations."}
        </Text>
      ) : chats && chats.length === 0 ? (
        <Text style={styles.emptyText}>No conversations yet.</Text>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={
            (item) => item.chatId?.toString() ?? `chat-${Math.random()}` // More stable fallback key
          }
          renderItem={renderChatItem}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </SafeAreaView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7",
    paddingTop: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 30,
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  transactionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0FFFF", // Light background for the button
    paddingVertical: 10, // Increased padding
    paddingHorizontal: 15, // Increased padding
    borderRadius: 25, // More rounded pill shape
    borderWidth: 1,
    borderColor: "#008B8B",
  },
  transactionsButtonText: {
    color: "#008B8B",
    fontSize: 15, // Slightly larger text
    fontWeight: "600",
    marginRight: 6, // More space
    fontFamily: "Poppins_500Medium",
  },
  messageBox: {
    backgroundColor: "#fff",
    paddingVertical: 18, // More vertical padding
    paddingHorizontal: 22, // More horizontal padding
    borderRadius: 18, // More rounded corners
    marginBottom: 16, // More space between items
    marginHorizontal: 12, // Add horizontal margin to the cards themselves
    borderWidth: 1,
    borderColor: "#E0F2F2", // Lighter border color
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, // Slightly more pronounced shadow
    shadowOpacity: 0.15, // Increased opacity
    shadowRadius: 4, // Increased radius
    elevation: 4, // For Android shadow
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8, // More space between header and message preview
    alignItems: "center",
    fontFamily: "Poppins_400Regular",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40, // Larger profile picture
    height: 40,
    borderRadius: 20, // Half of width/height for perfect circle
    marginRight: 12, // More space
    backgroundColor: "#D3D3D3", // Placeholder background for image
  },
  sender: {
    fontSize: 17, // Larger font
    fontWeight: "700",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  time: {
    fontSize: 13, // Slightly larger time font
    color: "#777", // Softer color for time
    fontFamily: "Poppins_400Regular",
  },
  lastMessagePreview: {
    fontSize: 15,
    fontWeight: "500", // Medium weight
    color: "#555", // Softer color for message preview
    fontFamily: "Poppins_500Medium",
  },
  loadingIndicator: {
    flex: 1, // Take full space for centering
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#D9534F", // A clear error red
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    paddingHorizontal: 20,
    fontFamily: "Poppins_400Regular",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 60, // More space from top
    color: "#999", // Softer grey
    fontSize: 18, // Larger font for empty state
    paddingHorizontal: 20,
    fontFamily: "Poppins_400Regular",
  },
  flatListContent: {
    paddingBottom: 20,
    paddingHorizontal: 8, // Adjust as per `messageBox` marginHorizontal
  },
});

export default Messages;
