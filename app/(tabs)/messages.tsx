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
import { Feather } from "@expo/vector-icons"; // Import Feather for the arrow icon

const formatTime = (timeString: string | undefined) => {
  if (!timeString) return "";
  const date = new Date(timeString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const Messages = () => {
  const { chats, loading, error } = useChatInbox();
  const router = useRouter();

  const onPressMessage = (chat: any) => {
    router.push({
      pathname: "/(pages)/ChatPage",
      params: {
        userId: chat.otherUserId?.toString() ?? "",
        userName: chat.otherUsername ?? "",
        profilePic: chat.otherPicture ?? "", // optional, add if available
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
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
                : require("@/assets/images/profile-pic-placeholder.png") // fallback image if no profile picture
            }
            style={styles.profileImage}
          />
          <Text style={styles.sender}>{item.otherUsername}</Text>
        </View>
        <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
      </View>
      <Text style={styles.subject} numberOfLines={1}>
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

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#008B8B"
          style={styles.loadingIndicator}
        />
      ) : error ? (
        <Text style={styles.errorText}>
          {typeof error === "string" ? error : "Failed to load conversations."}
        </Text>
      ) : chats.length === 0 ? (
        <Text style={styles.emptyText}>No conversations yet.</Text>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) =>
            item.chatId?.toString() ?? Math.random().toString()
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

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
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#008B8B",
  },
  transactionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0FFFF", // Light background for the button
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#008B8B",
  },
  transactionsButtonText: {
    color: "#008B8B",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 5,
  },
  messageBox: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#B0C4C4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: "center",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
  sender: {
    fontSize: 16,
    fontWeight: "700",
    color: "#008B8B",
  },
  time: {
    fontSize: 12,
    color: "#008B8B",
  },
  subject: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
    fontSize: 16,
    paddingHorizontal: 20,
  },
});

export default Messages;
