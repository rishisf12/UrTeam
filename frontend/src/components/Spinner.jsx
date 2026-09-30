// Loading spinner (white on gradient). Props: { label }
export default function Spinner({ label }) {
  return (
    <div className="flex items-center gap-2 py-2 text-purple-100 text-sm">
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
      <span>{label || "Loading..."}</span>
    </div>
  );
}
