import { useRouter } from "expo-router";
import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

interface Message {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  time: string;
  read: boolean;
}

const dummyMessages: Message[] = [
  {
    id: "1",
    sender: "Yazan Alqadery",
    subject: "Skill Swap Agreement",
    snippet:
      "Let's confirm our agreement to swap guitar lessons for cooking classes.",
    time: "10:15 AM",
    read: false,
  },
  {
    id: "2",
    sender: "Moauya Bdour",
    subject: "Session Scheduled",
    snippet:
      "Your web design session with Moauya is booked for tomorrow at 3pm.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "3",
    sender: "Abdalrahman Albaroudi",
    subject: "Exchange Proposal",
    snippet:
      "Would you like to swap your piano lessons for my digital marketing consultation?",
    time: "2 days ago",
    read: false,
  },
  {
    id: "4",
    sender: "Hamza Zahran",
    subject: "Item Delivery Confirmation",
    snippet:
      "Your package with the exchanged bicycle parts has been delivered successfully.",
    time: "3 days ago",
    read: true,
  },
  {
    id: "5",
    sender: "Abdalrahman Yahia",
    subject: "Feedback Request",
    snippet:
      "Please let me know how the gardening session went so we can finalize our exchange.",
    time: "Today",
    read: false,
  },
];

const router = useRouter();

const onPressMessage = (message: Message) => {
  router.push({
    pathname: "/(pages)/ChatPage",
    params: {
      sender: message.sender,
      conversationId: message.id,
    },
  });
};

const renderItem = ({ item }: { item: Message }) => (
  <TouchableOpacity
    style={[styles.messageBox, !item.read && styles.unread]}
    onPress={() => onPressMessage(item)}
  >
    <View style={styles.messageHeader}>
      <Text style={[styles.sender, !item.read && styles.unreadText]}>
        {item.sender}
      </Text>
      <Text style={[styles.time, !item.read && styles.unreadText]}>
        {item.time}
      </Text>
    </View>
    <Text style={[styles.subject, !item.read && styles.unreadText]}>
      {item.subject}
    </Text>
    <Text
      style={[styles.snippet, !item.read && styles.unreadText]}
      numberOfLines={1}
    >
      {item.snippet}
    </Text>
  </TouchableOpacity>
);

const Messages = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Inbox</Text>
      <FlatList
        data={dummyMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 8 }}
        showsVerticalScrollIndicator={false}
      />
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
    // subtle shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // subtle shadow for Android
    elevation: 2,
  },
  unread: {
    backgroundColor: "#E0F7F7",
    borderColor: "#008B8B",
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
  snippet: {
    fontSize: 13,
    color: "#555",
    fontFamily: "Poppins_400Regular",
  },
  unreadText: {
    color: "#008B8B",
  },
});

export default Messages;
