import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

interface ChatMessage {
  id?: string;
  content: string;
  senderId: number;
  receiverId: number;
  chatId?: number;
  timestamp?: string;
}

const SOCKET_URL = `${process.env.EXPO_PUBLIC_WS_URL}/ws`;

export const useChatSocket = (
  chatId: number,
  senderId: number,
  onMessagesReceived: (msgs: ChatMessage[]) => void, // for bulk messages
  onMessageReceived: (msg: ChatMessage) => void // for single new messages
) => {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const socket = new SockJS(SOCKET_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to topic for chat messages (both existing and new)
        client.subscribe(`/topic/chat.${chatId}`, (message: IMessage) => {
          const body = JSON.parse(message.body);

          // The message could be either a single message or an array of messages
          if (Array.isArray(body)) {
            onMessagesReceived(body);
          } else {
            onMessageReceived(body);
          }
        });

        // Request existing messages for this chatId
        client.publish({
          destination: `/app/chat.getMessages.${chatId}`,
          body: "",
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [chatId]);

  const sendMessage = (msg: Omit<ChatMessage, "senderId">) => {
    const messageWithSender: ChatMessage = {
      ...msg,
      senderId,
      chatId,
    };

    clientRef.current?.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(messageWithSender),
    });
  };

  return { sendMessage };
};
