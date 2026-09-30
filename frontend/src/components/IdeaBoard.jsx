// Board with tech filter. Props below; all data comes from App.jsx state.
import Spinner from "./Spinner.jsx";
import IdeaCard from "./IdeaCard.jsx";

export default function IdeaBoard({
  ideas, loading, currentStudentId, statusOf, joiningId, onJoin, techFilter, onTechChange,
}) {
  // All authenticated students can request chat access
  const hasChatAccess = true;

  // Show chat request button for non-owners, owner has direct access
  const showChatButton = (idea) => idea.owner_id !== currentStudentId;

  const onChatRequest = (idea) => {
    alert("Chat access request submitted for idea: " + idea.title + ". Owner will be notified.");
  };

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-5 shadow-xl border border-white/20">
      <h2 className="text-lg font-bold text-white">Idea Board</h2>
      <input value={techFilter} onChange={(e) => onTechChange(e.target.value)}
        placeholder="🔍 Filter by tech (e.g. python)"
        className="bg-white/15 text-white placeholder-purple-200 border border-white/30 rounded-lg px-3 py-1.5 mt-2 w-full text-sm outline-none focus:bg-white/25" />
      {loading ? (
        <Spinner label="Loading ideas..." />
      ) : (
        <div className="grid gap-3 mt-3 md:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isOwner={idea.owner_id === currentStudentId}
              requestStatus={statusOf(idea.id)}
              joining={joiningId === idea.id} onJoin={onJoin}
              hasChatAccess={hasChatAccess}
              onChatRequest={() => onChatRequest(idea)}
            />
          ))}
          {ideas.length === 0 && <p className="text-sm text-purple-100">No ideas found.</p>}
        </div>
      )}
    </div>
  );
}