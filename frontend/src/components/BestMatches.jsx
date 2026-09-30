// Best matches: score bars + matching/missing skills. Props: { matches, loading }
import Spinner from "./Spinner.jsx";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function BestMatches({ matches, loading }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-5 shadow-xl border border-white/20">
      <h2 className="text-lg font-bold text-white">🎯 Best matches for you</h2>
      {loading ? (
        <Spinner label="Scoring ideas..." />
      ) : (
        <div className="grid gap-3 mt-3">
          {(matches || []).map((m, i) => (
            <div key={m.idea_id} className="bg-white/95 rounded-xl p-3 shadow">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800 text-sm">{i < 3 ? MEDAL[i] + " " : ""}{m.title}</span>
                <span className="text-sm font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">{m.score}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2.5 mt-1.5">
                <div className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 h-2.5 rounded-full transition-all" style={{ width: m.score + "%" }} />
              </div>
              <p className="text-xs mt-1.5 text-gray-600">✅ Match: {(m.matching_skills || []).join(", ") || "—"}</p>
              <p className="text-xs text-gray-500">📚 Missing: {(m.missing_skills || []).join(", ") || "—"}</p>
            </div>
          ))}
          {(!matches || matches.length === 0) && <p className="text-sm text-purple-100">No matches yet.</p>}
        </div>
      )}
    </div>
  );
}
