import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useChatInbox } from "@/hooks/useChatInbox"; // Adjust path as needed

const Messages = () => {
  const { chats, loading, error } = useChatInbox();
  const router = useRouter();

  const onPressMessage = (chat: any) => {
    router.push({
      pathname: "/(pages)/ChatPage",
      params: {
        conversationId: chat.chatId.toString(),
        receiverId: chat.otherUserId.toString(),
        receiverUsername: chat.otherUsername,
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.messageBox}
      onPress={() => onPressMessage(item)}
    >
      <View style={styles.messageHeader}>
        <Text style={styles.sender}>{item.otherUsername}</Text>
        <Text style={styles.time}>{item.lastMessageTime}</Text>
      </View>
      <Text style={styles.subject} numberOfLines={1}>
        {item.lastMessage || "No messages yet"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Inbox</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#008B8B" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chatId.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No conversations yet.</Text>
          }
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
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    marginBottom: 16,
    paddingHorizontal: 16,
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
  },
  sender: {
    fontSize: 16,
    fontWeight: "700",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  time: {
    fontSize: 12,
    color: "#008B8B",
    fontFamily: "Poppins_400Regular",
  },
  subject: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
    fontSize: 16,
  },
});

export default Messages;
