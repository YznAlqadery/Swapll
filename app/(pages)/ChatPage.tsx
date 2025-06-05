import React, { useState, useRef } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: string;
}

const chatsByConversationId: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "1",
      text: "Hey! Are you ready to swap skills?",
      sender: "other",
      timestamp: "10:00 AM",
    },
    {
      id: "2",
      text: "Yes! Let's schedule a session.",
      sender: "me",
      timestamp: "10:05 AM",
    },
  ],
  "2": [
    {
      id: "1",
      text: "I sent you the service details.",
      sender: "other",
      timestamp: "Yesterday",
    },
    { id: "2", text: "Got it, thanks!", sender: "me", timestamp: "Yesterday" },
  ],
};

const ChatPage = () => {
  const { sender, conversationId } = useLocalSearchParams();

  const [messages, setMessages] = useState<ChatMessage[]>(
    chatsByConversationId[conversationId?.toString()] || []
  );
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const router = useRouter();

  const sendMessage = () => {
    if (inputText.trim().length === 0) return;

    const newMessage: ChatMessage = {
      id: (messages.length + 1).toString(),
      text: inputText,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="arrow-left" size={24} color="#008B8B" />
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={styles.chatHeader}>{sender}</Text>
        <TouchableOpacity style={styles.startSessionButton}>
          <FontAwesome name="calendar-check-o" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flexGrow}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            placeholderTextColor={"#999"}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={{ color: "white", fontWeight: "700" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F7" },
  flexGrow: {
    flex: 1,
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
    backgroundColor: "#008B8B",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: "#ddd",
    marginTop: 4,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0F7F7",
    borderTopWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    fontSize: 16,
    color: "#000",
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#008B8B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
    borderRadius: 20,
  },
  backButton: {
    position: "absolute",
    top: 52,
    left: 10,
    zIndex: 1,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  chatHeader: {
    fontSize: 24,
    fontWeight: "700",
    color: "#008B8B",
    marginLeft: 30,
    flex: 1,
  },
  startSessionButton: {
    backgroundColor: "#008B8B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
});

export default ChatPage;
