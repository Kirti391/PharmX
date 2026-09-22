import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

let socketSingleton = null;

export function getSocket() {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) return null;
  if (socketSingleton && socketSingleton.connected) return socketSingleton;
  if (socketSingleton) socketSingleton.disconnect();
  socketSingleton = io(SOCKET_URL, {
    path: "/socket.io",
    auth: { token: accessToken },
    transports: ["websocket", "polling"],
  });
  return socketSingleton;
}

/** Subscribes to a realtime event for the lifetime of the component. */
export function useRealtimeEvent(event, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const listener = (payload) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => socket.off(event, listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}
