// Visible error banner (red gradient). Props: { message, onClose }
export default function ErrorBanner({ message, onClose, type }) {
  if (!message) return null;
  const bg = type === "success"
    ? "bg-gradient-to-r from-emerald-500 to-green-600"
    : "bg-gradient-to-r from-red-500 to-rose-500";
  const text = type === "success" ? "text-white" : "text-white";
  return (
    <div className={`bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2.5 rounded-xl mb-3 flex justify-between items-center shadow text-sm ${text}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-4 font-bold hover:text-red-200">✕</button>
      )}
    </div>
  );
}
