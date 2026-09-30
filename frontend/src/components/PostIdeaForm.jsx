// Post an idea. Props: { ownerId, onPosted: (idea) => void }
import { useState } from "react";
import { createIdea } from "../api.js";
import ErrorBanner from "./ErrorBanner.jsx";
import Spinner from "./Spinner.jsx";

export default function PostIdeaForm({ ownerId, onPosted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tech, setTech] = useState("");
  const [size, setSize] = useState(3);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "bg-white/15 text-white placeholder-purple-200 border border-white/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:bg-white/25 w-full";

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!ownerId) {
      setError("Select a current student first.");
      return;
    }
    setBusy(true);
    try {
      const idea = await createIdea({
        title, description,
        tech_stack: tech.split(",").map((s) => s.trim()).filter(Boolean),
        team_size_needed: Number(size), owner_id: ownerId, is_open: true,
      });
      setTitle("");
      setDescription("");
      setTech("");
      onPosted(idea);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-5 shadow-xl border border-white/20">
      <h2 className="text-lg font-bold text-white">✨ Post an idea</h2>
      <ErrorBanner message={error} onClose={() => setError("")} />
      <form onSubmit={submit} className="grid gap-2 mt-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required className={input} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows="2" className={input} />
        <input value={tech} onChange={(e) => setTech(e.target.value)} placeholder="Tech, comma separated (Python, React...)" className={input} />
        <input type="number" min="1" max="20" value={size} onChange={(e) => setSize(e.target.value)} className={input} />
        {busy ? <Spinner label="Posting..." /> : (
          <button className="bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white font-bold px-3 py-2 rounded-lg shadow hover:opacity-90">Post idea 🚀</button>
        )}
      </form>
    </div>
  );
}
