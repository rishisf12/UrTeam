// Profile form: select current student or create/update. Props: { students, currentId, onSelect, onSaved }
import { useEffect, useState } from "react";
import { createStudent, updateStudent } from "../api.js";
import SkillTagInput from "./SkillTagInput.jsx";
import ErrorBanner from "./ErrorBanner.jsx";
import Spinner from "./Spinner.jsx";

const empty = { name: "", email: "", branch: "", year: 2, skills: [], bio: "" };

export default function ProfileForm({ students, currentId, onSelect, onSaved }) {
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = (students || []).find((s) => s.id === currentId);

  useEffect(() => {
    if (current && !editing) {
      setForm({ name: current.name, email: current.email, branch: current.branch || "", year: current.year || 2, skills: current.skills || [], bio: current.bio || "" });
    }
  }, [currentId]);

  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      let saved;
      if (editing && current) {
        saved = await updateStudent(current.id, form);
      } else {
        saved = await createStudent(form);
      }
      setEditing(false);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const input = "bg-white/15 text-white placeholder-purple-200 border border-white/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:bg-white/25 w-full";

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-5 shadow-xl border border-white/20">
      <h2 className="text-lg font-bold text-white">Your profile</h2>
      <div className="flex gap-2 items-center mt-2">
        <select value={currentId || ""} onChange={(e) => onSelect(Number(e.target.value))}
          className="flex-1 bg-white/15 text-white border border-white/30 rounded-lg px-2 py-1.5 text-sm outline-none">
          {(students || []).map((s) => (
            <option key={s.id} value={s.id} className="text-black">{s.name} ({s.email})</option>
          ))}
        </select>
        <button type="button" onClick={() => { setForm(empty); setEditing(false); }}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/20 text-white border border-white/30 hover:bg-white/35">+ New</button>
        {current && !editing && (
          <button type="button" onClick={() => setEditing(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white text-fuchsia-700 font-semibold hover:bg-purple-100">Edit</button>
        )}
      </div>
      {(editing || !current) && (
        <form onSubmit={submit} className="grid gap-2 mt-3">
          <ErrorBanner message={error} onClose={() => setError("")} />
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Name" required className={input} />
          <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" required className={input} />
          <div className="flex gap-2">
            <input value={form.branch} onChange={(e) => set("branch", e.target.value)} placeholder="Branch" className={input} />
            <input type="number" min="1" max="6" value={form.year} onChange={(e) => set("year", Number(e.target.value))} className={input} />
          </div>
          <SkillTagInput value={form.skills} onChange={(t) => set("skills", t)} />
          <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Bio" rows="2" className={input} />
          {busy ? <Spinner label="Saving..." /> : (
            <button className="bg-gradient-to-r from-amber-400 to-pink-500 text-white font-bold px-3 py-2 rounded-lg shadow hover:opacity-90">
              {editing ? "Update profile" : "Create profile"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
