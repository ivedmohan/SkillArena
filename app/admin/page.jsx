"use client";
import { useState, useRef } from "react";
import { saveGameConfig } from "../../lib/firestoreHelpers";

/**
 * Admin page — Upload new game JSON configs.
 * Config must have: { meta: { gameId, gameType, title }, config: { ... } }
 */
export default function AdminPage() {
  const [preview, setPreview] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const fileRef = useRef();

  function validateConfig(data) {
    if (!data.meta) return "Missing required field: meta";
    if (!data.meta.gameId) return "Missing meta.gameId";
    if (!data.meta.gameType) return "Missing meta.gameType";
    if (!data.meta.title) return "Missing meta.title";
    if (!data.config) return "Missing required field: config";
    const validTypes = ["grid", "word", "mcq", "logic"];
    if (!validTypes.includes(data.meta.gameType)) {
      return `meta.gameType must be one of: ${validTypes.join(", ")}`;
    }
    return null; // valid
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setValidationError("");
    setSuccessMsg("");
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const err = validateConfig(data);
        if (err) { setValidationError(err); return; }
        setPreview(data);
      } catch {
        setValidationError("Invalid JSON file.");
      }
    };
    reader.readAsText(f);
  }

  async function handleUpload() {
    if (!preview) return;
    setUploading(true);
    setValidationError("");
    try {
      await saveGameConfig(preview.meta.gameId, preview);
      setSuccessMsg(`✓ Config for "${preview.meta.title}" uploaded successfully!`);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setValidationError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white px-4 py-12 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-black mb-2">
          <span className="text-[#b44fff]">Admin</span> Panel
        </h1>
        <p className="text-[#8888aa] text-sm mb-8">Upload new game JSON configs. Instant plug-in to the engine.</p>

        {/* Upload box */}
        <div
          className="border-2 border-dashed border-[#2a2a4a] rounded-2xl p-8 text-center cursor-pointer hover:border-[#b44fff] transition-colors mb-4"
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="text-white font-semibold mb-1">Drop game config JSON here</p>
          <p className="text-[#8888aa] text-xs">or click to browse</p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="bg-[#ff009910] border border-[#ff0099]/30 text-[#ff0099] text-sm rounded-xl p-3 mb-4">
            {validationError}
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="bg-[#00ff8810] border border-[#00ff88]/30 text-[#00ff88] text-sm rounded-xl p-3 mb-4">
            {successMsg}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-5 mb-4">
            <h3 className="font-bold text-white mb-3">Config Preview</h3>
            <div className="space-y-2 text-sm">
              <Row label="Game ID" value={preview.meta.gameId} />
              <Row label="Type" value={preview.meta.gameType} />
              <Row label="Title" value={preview.meta.title} />
              <Row label="Difficulty" value={preview.meta.difficulty ?? "—"} />
              <Row label="Time Limit" value={preview.meta.timeLimit ? `${preview.meta.timeLimit}s` : "—"} />
              <Row label="Lives" value={preview.meta.lives ?? "—"} />
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`mt-5 w-full py-3 rounded-xl font-bold transition-all ${
                uploading
                  ? "bg-[#b44fff]/50 text-white cursor-wait"
                  : "bg-[#b44fff] text-white hover:shadow-[0_0_20px_rgba(180,79,255,0.4)]"
              }`}
            >
              {uploading ? "Uploading..." : "Upload to Firestore →"}
            </button>
          </div>
        )}

        {/* Config format guide */}
        <details className="border border-[#2a2a4a] rounded-xl">
          <summary className="px-4 py-3 text-sm text-[#8888aa] cursor-pointer hover:text-white transition-colors font-medium">
            Config format guide
          </summary>
          <pre className="px-4 pb-4 text-xs text-[#8888aa] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
{`{
  "meta": {
    "gameId":      "your-game",   // unique slug
    "gameType":    "mcq",         // grid | word | mcq | logic
    "title":       "My Game",
    "description": "...",
    "difficulty":  "medium",
    "timeLimit":   120,           // seconds
    "lives":       3,
    "version":     "1.0"
  },
  "config": {
    // game-specific data (questions, puzzles, rounds...)
  }
}`}
          </pre>
        </details>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-[#444466] hover:text-[#8888aa] underline underline-offset-2 transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#8888aa]">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
