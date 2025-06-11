import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useAuth } from "@/context/AuthContext";

const SOCKET_URL = `${process.env.EXPO_PUBLIC_WS_URL}/ws`;

export const useChatInbox = () => {
  const { user: token } = useAuth(); // Call hook here, at top level

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No auth token found.");
      setLoading(false);
      return;
    }

    let stompClient: Client | null = null;

    const sock = new SockJS(SOCKET_URL);

    stompClient = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        stompClient?.subscribe("/topic/inbox", (message) => {
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

        stompClient?.publish({
          destination: "/app/chat.getInbox",
          body: token,
        });
      },
      onStompError: (frame) => {
        setError("WebSocket error: " + frame.headers["message"]);
        setLoading(false);
      },
      onWebSocketError: () => {
        setError("Failed to connect to WebSocket.");
        setLoading(false);
      },
    });

    stompClient.activate();

    return () => {
      stompClient?.deactivate();
    };
  }, [token]);

  return { chats, loading, error };
};
