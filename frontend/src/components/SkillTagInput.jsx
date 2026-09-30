// Skill tag input with suggestion chips. Props: { value: string[], onChange }
import { useState } from "react";

const SUGGESTIONS = ["Python", "React", "AI/ML", "Node.js", "FastAPI", "Java", "Flutter", "UI/UX", "SQL"];

export default function SkillTagInput({ value, onChange }) {
  const [draft, setDraft] = useState("");
  const tags = value || [];

  function add(raw) {
    const t = String(raw).trim();
    if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    onChange([...tags, t]);
    setDraft("");
  }

  function remove(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span key={t} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
            {t}
            <button type="button" onClick={() => remove(t)} className="font-bold hover:text-pink-200">×</button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-purple-200">No skills yet — pick below.</span>}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {SUGGESTIONS.filter((s) => !tags.some((x) => x.toLowerCase() === s.toLowerCase())).map((s) => (
          <button key={s} type="button" onClick={() => add(s)}
            className="text-xs px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30 hover:bg-white/35">
            + {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); } }}
          placeholder="Custom skill + Enter"
          className="flex-1 bg-white/15 text-white placeholder-purple-200 border border-white/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:bg-white/25" />
        <button type="button" onClick={() => add(draft)}
          className="text-sm px-3 rounded-lg bg-white text-fuchsia-700 font-semibold hover:bg-purple-100">Add</button>
      </div>
    </div>
  );
}
