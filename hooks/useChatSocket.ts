import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

export interface ChatMessage {
  sender: string;
  id?: string;
  content: string;
  senderId: number;
  receiverId: number;
  chatId?: number;
  timestamp?: string;
}

interface ChatMessageDTO {
  content: string;
  receiverId: number;
  token: string;
  chatId?: number;
}

interface SendMessageInput {
  content: string;
  receiverId: number;
}

const SOCKET_URL = `${process.env.EXPO_PUBLIC_WS_URL}/ws`;

export const useChatSocket = (
  chatId: number,
  senderId: number,
  token: string,
  onMessagesReceived: (msgs: ChatMessage[]) => void,
  onMessageReceived: (msg: ChatMessage) => void
) => {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!chatId || !token) return;

    const socket = new SockJS(SOCKET_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to chat messages topic
        client.subscribe(`/topic/chat.${chatId}`, (message: IMessage) => {
          const body = JSON.parse(message.body);
          if (Array.isArray(body)) {
            onMessagesReceived(body);
          } else {
            onMessageReceived(body);
          }
        });

        // Request past messages for this chat
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
  }, [chatId, token]);

  const sendMessage = (msg: SendMessageInput) => {
    if (!clientRef.current) return;

    const messageWithToken: ChatMessageDTO = {
      ...msg,
      token,
      chatId,
    };

    clientRef.current.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(messageWithToken),
    });
  };

  return { sendMessage };
};
