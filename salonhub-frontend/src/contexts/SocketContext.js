import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log("=== SOCKET DEBUG ===");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("user:", user);
    console.log("tenant_id:", user?.tenant_id);

    // On ne se connecte que si l'utilisateur est staff/admin connecté
    if (isAuthenticated && user && user.tenant_id) {
      const apiUrl =
        process.env.REACT_APP_API_URL.replace("/api", "") ||
        "http://localhost:5000";
      console.log("📡 Connexion WebSocket à:", apiUrl);

      const newSocket = io(apiUrl);

      newSocket.on("connect", () => {
        console.log(
          "🟢 Connecté au serveur WebSocket - Socket ID:",
          newSocket.id
        );
        // Rejoindre la room du salon
        newSocket.emit("join_tenant", user.tenant_id);
        console.log("📤 Demande de rejoindre tenant:", user.tenant_id);
      });

      newSocket.on("joined", (data) => {
        console.log("✅ Rejoint la room avec succès:", data);
      });

      newSocket.on("disconnect", () => {
        console.log("🔴 Déconnecté du serveur WebSocket");
      });

      newSocket.on("error", (error) => {
        console.error("❌ Erreur WebSocket:", error);
      });

      setSocket(newSocket);

      return () => {
        console.log("🔌 Nettoyage connexion WebSocket");
        newSocket.close();
      };
    } else {
      console.warn("⚠️  Conditions non remplies pour la connexion WebSocket");
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
