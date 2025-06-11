import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useAuth } from "@/context/AuthContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import Divider from "@/components/Divider";
import { useChatSocket } from "@/hooks/useChatSocket";

interface ChatMessage {
  id?: string;
  content: string;
  senderId: number;
  receiverId: number;
  chatId?: number;
  timestamp?: string;
  sender?: "me" | "other";
}

const ChatPage = () => {
  const { userId, userName, profilePic } = useLocalSearchParams();
  const { user: token } = useAuth();
  const { user } = useLoggedInUser();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatId, setChatId] = useState<number | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const formatTimestamp = (timestamp?: string) => {
    return new Date(timestamp || Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!user?.id || !userId) return;

    const fetchChatId = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/with/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error("Failed to get chat ID");

        const chatSummary = await response.json();
        setChatId(chatSummary.chatId ?? chatSummary.id);
      } catch (error) {
        console.error("Error fetching chat ID:", error);
      }
    };

    fetchChatId();
  }, [userId, user?.id, token]);

  const { sendMessage: sendSocketMessage } = useChatSocket(
    chatId ?? 0,
    user?.id ?? 0,
    (incomingMessages: ChatMessage[]) => {
      const formatted = incomingMessages.map((msg) => ({
        ...msg,
        sender:
          msg.senderId === user?.id ? ("me" as const) : ("other" as const),
        timestamp: formatTimestamp(msg.timestamp),
      }));

      setMessages(formatted);

      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: false }),
        100
      );
    },
    (incomingMessage: ChatMessage) => {
      const formatted: ChatMessage = {
        ...incomingMessage,
        sender: (incomingMessage.senderId === user?.id ? "me" : "other") as
          | "me"
          | "other",
        timestamp: formatTimestamp(incomingMessage.timestamp),
      };

      setMessages((prev) => [...prev, formatted]);

      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  );

  useEffect(() => {
    if (!profilePic || !token) return;

    const fetchProfileImage = async () => {
      try {
        const imageUrl = process.env.EXPO_PUBLIC_API_URL! + profilePic;
        const localUri = `${FileSystem.cacheDirectory}profile-pic-${userId}.jpg`;

        const downloadRes = await FileSystem.downloadAsync(imageUrl, localUri, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLocalImageUri(downloadRes.uri);
      } catch (error) {
        console.error("Failed to download profile pic:", error);
        setLocalImageUri(null);
      }
    };

    fetchProfileImage();
  }, [profilePic, token, userId]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !chatId || !user?.id) return;

    const newMessage = {
      content: inputText.trim(),
      receiverId: Number(userId),
    };

    sendSocketMessage(newMessage);
    setInputText("");
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender === "me";

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#008B8B" />
        </TouchableOpacity>
        <Image
          source={
            localImageUri
              ? { uri: localImageUri }
              : require("@/assets/images/profile-pic-placeholder.png")
          }
          style={styles.profilePic}
        />
        <Text style={styles.userName}>{userName}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flexGrow}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id ?? Math.random().toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f4f3" },
  flexGrow: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f2f4f3",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    paddingRight: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderColor: "#008B8B",
    borderWidth: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },

  messageContainer: {
    maxWidth: "70%",
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  myMessage: {
    backgroundColor: "#008B8B",
    alignSelf: "flex-end",
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    backgroundColor: "#4f5a60",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  messageText: { color: "#fff", fontSize: 16 },
  timestamp: {
    fontSize: 10,
    color: "#ddd",
    marginTop: 4,
    textAlign: "right",
  },

  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopColor: "#eee",
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: "#008B8B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "700",
  },
});

export default ChatPage;
