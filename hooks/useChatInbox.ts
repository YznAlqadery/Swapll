import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const SOCKET_URL = `${process.env.EXPO_PUBLIC_WS_URL}/ws`;

export const useChatInbox = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sock = new SockJS(SOCKET_URL);
    const stompClient = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe("/topic/inbox", (message) => {
          try {
            const parsed = JSON.parse(message.body);
            setChats(parsed);
          } catch (err) {
            console.error("Inbox JSON parse error:", err);
            setError("Failed to parse inbox data.");
          } finally {
            setLoading(false);
          }
        });

        stompClient.publish({
          destination: "/app/chat.getInbox",
          body: "",
        });
      },
      onStompError: (frame) => {
        setError("WebSocket error: " + frame.headers.message);
        setLoading(false);
      },
      onWebSocketError: () => {
        setError("Failed to connect to WebSocket.");
        setLoading(false);
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  return { chats, loading, error };
};
