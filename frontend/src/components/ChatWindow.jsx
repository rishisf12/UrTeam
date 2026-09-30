// Chat Window component for idea discussions with WebSocket real-time updates
// Props: { idea, isOwner, approvedStudents, onSendMessage, onClose }
import { useState, useEffect, useRef } from "react";
import { sendMessage, listMessages } from "../api";
import ErrorBanner from "./ErrorBanner.jsx";
import Spinner from "./Spinner.jsx";

const MAX_LINES = 2; // Chat limited to 2 lines per message as requested

function ChatWindow({ idea, isOwner, approvedStudents, onSendMessage, onClose, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wsRef = useRef(null);

  // Load messages when component mounts or idea changes
  useEffect(() => {
    if (idea.id) {
      setLoading(true);
      listMessages(idea.id).then((data) => {
        setMessages(data || []);
        setLoading(false);
      }).catch((e) => {
        setError(e.message);
        setLoading(false);
      });
    }
  }, [idea.id]);

  // WebSocket connection for real-time messages
  useEffect(() => {
    if (!idea.id) return;
    const wsUrl = (import.meta.env.VITE_API_URL || "http://localhost:8001").replace("http", "ws") + "/ws/" + idea.id;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          // Add incoming message to state
          const newMsg = {
            id: data.id,
            text: data.text,
            student_id: data.student_id,
            created_at: data.created_at
          };
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            const filtered = prev.filter(m => m.student_id !== newMsg.student_id || m.text !== newMsg.text);
            return [newMsg, ...filtered].slice(0, 50);
          });
        }
      } catch (e) {
        console.error("WS parse error:", e);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed for idea", idea.id);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [idea.id]);

  // Fetch approved students list
  useEffect(() => {
    // In a full impl, would fetch from API; for now use approvedStudents prop
  }, [approvedStudents]);

  // Handle sending a message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !idea.id || !currentUserId) return;
    setLoading(true);
    try {
      await sendMessage(idea.id, currentUserId, newMessage);
      // Local optimistic update
      const newLine = { id: Date.now(), text: newMessage, student_id: currentUserId, created_at: new Date().toISOString() };
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.student_id !== currentUserId || m.text !== newMessage);
        return [newLine, ...filtered].slice(0, 50);
      });
      setNewMessage("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can send messages
  const canSend = isOwner || (approvedStudents && approvedStudents.includes(currentUserId));

  return (
    <div className="bg-white/95 rounded-2xl p-4 shadow-lg border-t-4 border-emerald-500 max-h-[600px] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-800">
          {idea.title} Chat
          {isOwner && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
              Owner
            </span>
          )}
        </h3>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      {/* Messages area */}
      {loading ? (
        <Spinner label="Loading messages..." />
      ) : (
        <div className="h-[400px] overflow-y-auto space-y-2">
          {messages.map((msg) => {
            const isCurrentUser = msg.student_id === currentUserId;
            return (
              <div key={msg.id} className={`p-3 rounded-md mb-2 ${
                isCurrentUser ? "bg-blue-100 text-blue-800 self-end" : "bg-gray-100 text-gray-800 self-start"
              } max-w-md`}>
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs text-gray-500 capitalize">{isCurrentUser ? "You" : "Other"} • {new Date(msg.created_at).toLocaleTimeString()}</p>
              </div>
            );
          })}
          {messages.length === 0 && <p className="text-center text-gray-400 italic">No messages yet. Be the first to send a hello!</p>}
        </div>
      )}

      {/* Message input */}
      {canSend && !loading && (
        <div className="pt-3 border-t border-gray-200">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Type message (max ${MAX_LINES} lines)…`}
              className="flex-1 bg-white/15 text-white border border-white/30 rounded-lg px-3 py-1.5 outline-none focus:bg-white/25 text-sm"
              maxLength={200}
            />
            <button type="submit" className="bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-emerald-500">
              Send
            </button>
          </form>
          {error && <ErrorBanner message={error} onClose={() => setError("")} />}
        </div>
      )}
    </div>
  );
}
export default ChatWindow;