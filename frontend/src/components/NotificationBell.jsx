// Notification bell component showing pending chat requests for the owner
import { useEffect, useState } from "react";
import { listChatRequests, approveChatRequest } from "../api.js";
import ErrorBanner from "./ErrorBanner.jsx";

export default function NotificationBell({ currentUserId, ideas }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for ideas where user is owner
    const ownerIdeas = ideas.filter((idea) => idea.owner_id === currentUserId);
    const checkRequests = async () => {
      setLoading(true);
      const requests = [];
      for (const idea of ownerIdeas) {
        try {
          const rs = await listChatRequests(idea.id);
          const pending = rs.filter((r) => r.status === "pending");
          if (pending.length > 0) {
            requests.push({ ideaId: idea.id, count: pending.length });
          }
        } catch (_e) { /* keep going */ }
      }
      setPendingRequests(requests);
      setLoading(false);
    };
    checkRequests();
  }, [currentUserId, ideas]);

  const handleApprove = async (chatId, ideaId) => {
    setLoading(true);
    try {
      const r = await approveChatRequest(chatId, currentUserId, "approved");
      // Refresh requests
      const idea = ideas.find((i) => i.id === ideaId);
      if (idea) {
        const idx = pendingRequests.findIndex((p) => p.ideaId === ideaId);
        if (idx >= 0) {
          pendingRequests[idx].count -= 1;
          if (pendingRequests[idx].count <= 0) pendingRequests.splice(idx, 1);
        }
      }
      setLoading(false);
      return r;
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  return (
    <div className="relative">
      <button
        className="bg-gray-800 rounded-full p-2 text-white hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        🔔 {pendingRequests.length > 0 ? pendingRequests.length : ""}
      </button>
    </div>
  );
}