import { useEffect, useState } from "react";
import { listStudents, listIdeas, listRequests, getMatches, requestChatAccess, listChatRequests, approveChatRequest, sendMessage, listMessages } from "./api.js";
import ErrorBanner from "./components/ErrorBanner.jsx";
import Spinner from "./components/Spinner.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import ProfileForm from "./components/ProfileForm.jsx";
import IdeaBoard from "./components/IdeaBoard.jsx";
import PostIdeaForm from "./components/PostIdeaForm.jsx";
import BestMatches from "./components/BestMatches.jsx";
import ChatWindow from "./components/ChatWindow.jsx";

export default function App() {
  const [students, setStudents] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchBusy, setMatchBusy] = useState(false);
  const [reqMap, setReqMap] = useState({});
  const [chatReqMap, setChatReqMap] = useState({}); // idea_id -> "pending"|"approved"|"rejected"
  const [approvedStudents, setApprovedStudents] = useState({}); // idea_id -> [student_ids]
  const [tech, setTech] = useState("");
  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [error, setError] = useState("");
  const [notify, setNotify] = useState("");
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const [activeIdeaId, setActiveIdeaId] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [s, i] = await Promise.all([listStudents(), listIdeas(tech || undefined)]);
      setStudents(s);
      if (!currentId && s.length) setCurrentId(s[0].id);
      setIdeas(i);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMatches(sid) {
    if (!sid) return;
    setMatchBusy(true);
    try {
      const d = await getMatches(sid);
      setMatches(d.matches);
    } catch (e) {
      setError(e.message);
    } finally {
      setMatchBusy(false);
    }
  }

  async function loadStatuses() {
    const m = {};
    for (const idea of ideas) {
      try {
        const rs = await listRequests(idea.id);
        const mine = rs.find((r) => r.student_id === currentId);
        m[idea.id] = mine ? mine.status : "none";
      } catch (_e) { /* keep none */ }
    }
    setReqMap(m);
  }

  async function loadChatRequests() {
    if (!currentId || ideas.length === 0) return;
    setChatReqMap({});
    for (const idea of ideas) {
      try {
        const r = await listChatRequests(idea.id);
        setChatReqMap((p) => ({ ...p, [idea.id]: r.length > 0 ? "pending" : "none" }));
      } catch (_e) { /* keep current state */ }
    }
  }

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadMatches(currentId); }, [currentId]);
  useEffect(() => { loadStatuses(); }, [ideas, currentId]);
  useEffect(() => { loadChatRequests(); }, [ideas, currentId]);

  async function handleJoin(ideaId) {
    setJoiningId(ideaId);
    setError("");
    try {
      const r = await joinIdea(ideaId, currentId);
      setReqMap((p) => ({ ...p, [ideaId]: r.status }));
      setNotify("✅ Join request sent. Creator notified — chat limited to 2 lines.");
      setTimeout(() => setNotify(""), 5000);
    } catch (e) {
      setError(e.message);
    } finally {
      setJoiningId(null);
    }
  }

  async function handleChatRequest(ideaId) {
    setError("");
    try {
      const r = await requestChatAccess(ideaId, currentId);
      setNotify("Chat access request submitted. Owner will be notified.");
      setTimeout(() => setNotify(""), 5000);
      const cr = await listChatRequests(ideaId);
      setChatReqMap((p) => ({ ...p, [ideaId]: cr.length > 0 ? "pending" : "none" }));
    } catch (e) {
      setError(e.message);
    }
  }

  function handleSaved(saved) {
    setStudents((p) => {
      const i = p.findIndex((s) => s.id === saved.id);
      if (i >= 0) { const c = [...p]; c[i] = saved; return c; }
      return [...p, saved];
    });
    setCurrentId(saved.id);
    loadMatches(saved.id);
  }

  // Helper to get chat status for an idea
  function getChatStatus(ideaId) {
    return chatReqMap[ideaId] || "none";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-800 to-fuchsia-700">
      <div className="max-w-5xl mx-auto p-4 pb-10">
        <header className="text-center py-6">
          <h1 className="text-4xl font-black text-white drop-shadow-lg">
            🚀 Team<span className="bg-gradient-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">Pilot</span>
          </h1>
          <p className="text-purple-200 text-sm mt-1">Find your hackathon dream team</p>
        </header>
        {notify && <div className="bg-green-500 text-white px-4 py-2 mt-2 rounded-md text-center animate-bounce">{notify}</div>}
        <ErrorBanner message={error} onClose={() => setError("")} />
        <NotificationBell currentUserId={currentId} ideas={ideas} />
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileForm students={students} currentId={currentId} onSelect={setCurrentId} onSaved={handleSaved} />
          <PostIdeaForm ownerId={currentId} onPosted={(idea) => setIdeas((p) => [...p, idea])} />
        </div>
        {loading && <Spinner label="Loading..." />}
        <div className="mt-4">
          <BestMatches matches={matches} loading={matchBusy} />
        </div>
        <div className="mt-4">
          <IdeaBoard ideas={ideas} loading={loading} currentStudentId={currentId}
            statusOf={(id) => reqMap[id] || "none"} joiningId={joiningId}
            onJoin={handleJoin} techFilter={tech} onTechChange={(v) => { setTech(v); }}
            hasChatAccess={true} onChatRequest={() => handleChatRequest()} />
        </div>
        {chatWindowOpen && (
          <ChatWindow
            ideaId={activeIdeaId}
            isOwner={activeIdeaId && ideas.some((i) => i.owner_id === activeIdeaId)}
            approvedStudents={approvedStudents}
            onSendMessage={async (text) => {
              if (activeIdeaId && currentId) {
                await sendMessage(activeIdeaId, currentId, text);
                setNewMessage("");
              }
            }}
            onClose={() => setChatWindowOpen(false)}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
          />
        )}
      </div>
    </div>
  );
}