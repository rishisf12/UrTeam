// Card for one idea with Join button + visible status.
// Props: { idea, isOwner, requestStatus: "none"|"pending"|"accepted"|"rejected", joining, onJoin, hasChatAccess, onChatRequest }
import Spinner from "./Spinner.jsx";

export default function IdeaCard({ idea, isOwner, requestStatus, joining, onJoin, hasChatAccess, onChatRequest }) {
  const closed = !idea.is_open;
  const decided = requestStatus === "pending" || requestStatus === "accepted";
  const disabled = isOwner || closed || joining || decided;
  let label = "Join team";
  if (isOwner) label = "Your idea";
  else if (closed) label = "Closed";
  else if (requestStatus === "pending") label = "Pending...";
  else if (requestStatus === "accepted") label = "Accepted ✓";
  else if (requestStatus === "rejected") label = "Rejected — retry?";
  return (
    <div className="bg-white/95 rounded-2xl p-4 shadow-lg border-t-4 border-fuchsia-500">
      <div className="flex justify-between items-center gap-2">
        <h3 className="font-bold text-gray-800">{idea.title}</h3>
        <span className={closed
          ? "text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white"
          : "text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"}>
          {closed ? "Closed" : "Open"}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{idea.description}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {(idea.tech_stack || []).map((t) => (
          <span key={t} className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full border border-indigo-200">{t}</span>
        ))}
      </div>
      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-gray-500">Team size: {idea.team_size_needed}</p>
        {requestStatus !== "none" && !isOwner && (
          <p className="text-xs font-semibold text-fuchsia-700">Status: {requestStatus}</p>
        )}
      </div>
      {joining ? (
        <Spinner label="Joining..." />
      ) : (
        <button onClick={() => onJoin(idea.id)} disabled={disabled && requestStatus !== "rejected"}
          className="mt-2 w-full font-semibold px-3 py-1.5 rounded-lg text-white shadow bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:opacity-90 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500">
          {label}
        </button>
      )}
      {!isOwner && !closed && hasChatAccess && (
        <button onClick={() => onChatRequest(idea.id)}
          className="mt-2 w-full font-semibold px-3 py-1.5 rounded-lg text-white shadow bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 hover:opacity-90 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500">
          Request chat access
        </button>
      )}
    </div>
  );
}
