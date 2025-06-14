import { useEffect, useState, useCallback, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useAuth } from "@/context/AuthContext";

const SOCKET_URL = `${process.env.EXPO_PUBLIC_WS_URL}/ws`;

export const useChatInbox = () => {
  const { user: token } = useAuth();

  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Renamed 'loading' to 'isLoading' for consistency with react-query pattern
  const [isRefetching, setIsRefetching] = useState(false); // New state for refetching status
  const [error, setError] = useState<string | null>(null);

  // useRef to hold the stompClient instance so it's stable across renders
  const stompClientRef = useRef<Client | null>(null);

  // Function to explicitly fetch inbox data
  const fetchInbox = useCallback(() => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      // Set refetching state when a fetch is initiated
      if (!isLoading) {
        // Only set isRefetching if not in initial loading state
        setIsRefetching(true);
      }
      stompClientRef.current.publish({
        destination: "/app/chat.getInbox",
        body: token || "",
      });
    } else {
      console.warn("STOMP client not connected, cannot fetch inbox.");
      // Optionally handle this error, but for pull-to-refresh,
      // it might just mean the connection isn't ready yet, and it will retry.
    }
  }, [token, isLoading]); // isLoading is a dependency to know when initial load is done

  useEffect(() => {
    if (!token) {
      setError("No auth token found. Please log in.");
      setIsLoading(false);
      setIsRefetching(false); // Ensure refetching is false if no token
      return;
    }

    // Initialize stompClient only if it hasn't been initialized or is null
    if (!stompClientRef.current) {
      const sock = new SockJS(SOCKET_URL);
      stompClientRef.current = new Client({
        webSocketFactory: () => sock,
        reconnectDelay: 5000,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        onConnect: () => {
          console.log("STOMP Connected");
          // Subscribe to inbox updates
          stompClientRef.current?.subscribe("/topic/inbox", (message) => {
            try {
              const parsed = JSON.parse(message.body);
              setChats(parsed);
              // Data received, so loading/refetching is complete
              setIsLoading(false);
              setIsRefetching(false);
              setError(null); // Clear any previous errors
            } catch (err) {
              console.error("Inbox JSON parse error:", err);
              setError("Failed to parse inbox data.");
              setIsLoading(false);
              setIsRefetching(false);
            }
          });

          // Request initial inbox data after successful connection and subscription
          fetchInbox();
        },
        onStompError: (frame) => {
          console.error("STOMP Error:", frame);
          setError(
            "WebSocket error: " + frame.headers["message"] ||
              "Unknown STOMP error."
          );
          setIsLoading(false);
          setIsRefetching(false);
        },
        onWebSocketError: (event) => {
          console.error("WebSocket Error:", event);
          setError("Failed to connect to chat server.");
          setIsLoading(false);
          setIsRefetching(false);
        },
        onDisconnect: () => {
          console.log("STOMP Disconnected");
          // Optionally reset states or show a message upon disconnect
        },
      });

      stompClientRef.current.activate();
    }

    // Cleanup function
    return () => {
      // Only deactivate if the current ref client is active
      if (stompClientRef.current && stompClientRef.current.active) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null; // Clear the ref on cleanup
        console.log("STOMP Client Deactivated on cleanup");
      }
    };
  }, [token, fetchInbox]); // Add fetchInbox to dependencies

  // The `refetch` function that will be exposed
  const refetch = useCallback(() => {
    // Only allow refetch if client exists and is connected
    if (stompClientRef.current && stompClientRef.current.connected) {
      fetchInbox();
    } else {
      // If not connected, we can try to activate it again or just log
      console.warn(
        "Attempted refetch when STOMP client was not connected. Re-activating..."
      );
      if (stompClientRef.current) {
        stompClientRef.current.activate(); // Try to reconnect/activate
      } else {
        // If ref is null, it means useEffect's cleanup ran, re-run useEffect for fresh setup
        // This is handled by `token` dependency changing, but if token is stable,
        // it might need a more explicit re-initialization strategy.
        // For now, rely on `useEffect`'s dependency array.
      }
      setIsRefetching(false); // Do not show refreshing indicator if re-activation is needed
    }
  }, [fetchInbox]);

  return { chats, isLoading, isRefetching, error, refetch };
};
