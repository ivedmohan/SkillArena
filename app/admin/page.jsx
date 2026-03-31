"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveGameConfig } from "../../lib/firestoreHelpers";

const GAME_TYPES = [
  { id: "mcq", label: "MCQ / Aptitude", icon: "🧠" },
  { id: "word", label: "Word Builder", icon: "📝" },
  { id: "logic", label: "Logic / Reasoning", icon: "🔮" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", color: "#00ff88" },
  { id: "medium", label: "Medium", color: "#ffcc00" },
  { id: "hard", label: "Hard", color: "#ff0099" },
];

const TOPICS = [
  "Percentages", "Profit & Loss", "Time & Distance", "Averages",
  "Ratios", "Simple Interest", "Permutations", "Number Series",
  "Logical Reasoning", "Blood Relations", "Coding-Decoding",
  "Vocabulary", "Synonyms & Antonyms", "Data Interpretation",
];

/**
 * Admin page — AI Generation + Manual Upload of game JSON configs.
 */
export default function AdminPage() {
  // ── Manual upload state ──
  const [preview, setPreview] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const fileRef = useRef();

  // ── AI generation state ──
  const [aiGameType, setAiGameType] = useState("mcq");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiCount, setAiCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [needsKey, setNeedsKey] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");

  // ── Custom Meta state for saving ──
  const [author, setAuthor] = useState("");
  const [slug, setSlug] = useState("");

  // Auto-generate slug when preview is set
  useEffect(() => {
    if (preview && !slug) {
      const base = preview.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      setSlug(`${base}-${Math.floor(Math.random() * 1000)}`);
    }
  }, [preview]);


  // ── Manual upload logic ──
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
    return null;
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
    if (!slug.trim()) { setValidationError("Custom URL Slug is required."); return; }
    
    setUploading(true);
    setValidationError("");
    try {
      const finalConfig = {
        ...preview,
        meta: {
          ...preview.meta,
          author: author.trim() || "Anonymous",
        }
      };
      // Save it under the custom unique slug instead of the plugin gameId
      await saveGameConfig(slug.trim(), finalConfig);
      setSuccessMsg(`✓ Config for "${preview.meta.title}" uploaded successfully!`);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setValidationError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // ── AI Generation logic ──
  async function handleAiGenerate() {
    if (!aiTopic.trim()) { setAiError("Enter a topic!"); return; }
    setGenerating(true);
    setAiError("");
    setSuccessMsg("");
    setPreview(null);

    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: aiGameType,
          topic: aiTopic.trim(),
          difficulty: aiDifficulty,
          questionCount: aiCount,
          userApiKey: userApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsKey) {
          setNeedsKey(true);
          setAiError(data.error);
        } else {
          setAiError(data.error || "Generation failed");
        }
        return;
      }

      setPreview(data.config);
      setNeedsKey(false);
      setSuccessMsg(`✨ AI generated "${data.config.meta.title}" — review below and upload!`);
    } catch (err) {
      setAiError(err.message || "Network error");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownloadSample() {
    const sample = {
      meta: {
        gameId: "sudoku", gameType: "grid", title: "Sudoku Custom",
        description: "A custom 9x9 puzzle loaded via JSON.",
        difficulty: "hard", timeLimit: 300, lives: 5, version: "1.0",
        targetSkills: ["logic", "attention-to-detail"],
        learningOutcome: "Develop logical reasoning and systematic problem solving",
      },
      config: {
        puzzles: [{
          id: "p1", difficulty: "hard", pointsPerCell: 10,
          grid: Array(9).fill(Array(9).fill(0)),
          solution: Array(9).fill(Array(9).fill(0)),
        }],
      },
    };
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sample-game-config.json";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white px-4 py-12 flex flex-col items-center">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#b44fff] rounded-full blur-[140px] opacity-[0.06]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00ff88] rounded-full blur-[140px] opacity-[0.06]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <h1 className="text-3xl font-black mb-2">
          <span className="text-[#b44fff]">Admin</span> Panel
        </h1>
        <p className="text-[#8888aa] text-sm mb-8">
          Generate AI-powered games or upload custom configs. Instant plug-in to the engine.
        </p>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* AI GENERATION SECTION                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <h2 className="text-lg font-black text-white">AI Game Generator</h2>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#b44fff]/20 text-[#b44fff] font-bold uppercase tracking-wider">
              Gemini
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-5 space-y-4">
            {/* Game Type */}
            <div>
              <label className="block text-xs font-bold text-[#8888aa] uppercase tracking-wider mb-2">Game Type</label>
              <div className="flex gap-2">
                {GAME_TYPES.map(gt => (
                  <button
                    key={gt.id}
                    onClick={() => setAiGameType(gt.id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      aiGameType === gt.id
                        ? "border-[#b44fff] bg-[#b44fff]/15 text-white"
                        : "border-[#2a2a4a] text-[#8888aa] hover:border-[#444466]"
                    }`}
                  >
                    {gt.icon} {gt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold text-[#8888aa] uppercase tracking-wider mb-2">Topic</label>
              <input
                type="text"
                value={aiTopic}
                onChange={e => { setAiTopic(e.target.value); setAiError(""); }}
                placeholder="e.g., Percentages, Logical Reasoning, Vocabulary..."
                className="w-full bg-[#0f0f1a] border border-[#2a2a4a] text-white p-3 rounded-xl focus:outline-none focus:border-[#b44fff] focus:ring-1 focus:ring-[#b44fff] placeholder-[#444466] transition-all text-sm"
              />
              {/* Quick topic pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TOPICS.slice(0, 8).map(t => (
                  <button
                    key={t}
                    onClick={() => setAiTopic(t)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      aiTopic === t
                        ? "bg-[#b44fff]/20 text-[#b44fff] border border-[#b44fff]/30"
                        : "bg-[#ffffff08] text-[#8888aa] hover:text-white border border-transparent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty + Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#8888aa] uppercase tracking-wider mb-2">Difficulty</label>
                <div className="flex gap-1.5">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setAiDifficulty(d.id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        aiDifficulty === d.id
                          ? "text-[#0f0f1a]"
                          : "border-[#2a2a4a] text-[#8888aa]"
                      }`}
                      style={
                        aiDifficulty === d.id
                          ? { borderColor: d.color, background: d.color, boxShadow: `0 0 12px ${d.color}44` }
                          : {}
                      }
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8888aa] uppercase tracking-wider mb-2">Questions</label>
                <select
                  value={aiCount}
                  onChange={e => setAiCount(Number(e.target.value))}
                  className="w-full bg-[#0f0f1a] border border-[#2a2a4a] text-white p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#b44fff]"
                >
                  {[5, 10, 15, 20].map(n => (
                    <option key={n} value={n}>{n} questions</option>
                  ))}
                </select>
              </div>
            </div>

            {/* User API Key (shown when server key exhausted or user wants to use their own) */}
            <div>
              <button
                onClick={() => setNeedsKey(k => !k)}
                className="text-[10px] text-[#8888aa] hover:text-[#b44fff] transition-colors underline underline-offset-2 mb-2"
              >
                {needsKey ? "Hide API key field" : "Use your own Gemini API key"}
              </button>
              <AnimatePresence>
                {needsKey && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#ffcc00]/5 border border-[#ffcc00]/20 rounded-xl p-3 mb-2">
                      <p className="text-[10px] text-[#ffcc00] mb-2 font-medium">
                        🔑 Get a free API key from{" "}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                          aistudio.google.com/apikey
                        </a>
                      </p>
                      <input
                        type="password"
                        value={userApiKey}
                        onChange={e => setUserApiKey(e.target.value)}
                        placeholder="Paste your Gemini API key..."
                        className="w-full bg-[#0f0f1a] border border-[#2a2a4a] text-white p-2.5 rounded-lg text-xs focus:outline-none focus:border-[#ffcc00] placeholder-[#444466]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Generate button */}
            <button
              onClick={handleAiGenerate}
              disabled={generating || !aiTopic.trim()}
              className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                generating
                  ? "bg-[#b44fff]/40 text-white/60 cursor-wait"
                  : "bg-gradient-to-r from-[#b44fff] to-[#8833dd] text-white hover:shadow-[0_0_25px_rgba(180,79,255,0.4)] hover:scale-[1.01] active:scale-[0.99]"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>✨ Generate Game with AI</>
              )}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ERRORS & SUCCESS                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {aiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#ff009910] border border-[#ff0099]/30 text-[#ff0099] text-sm rounded-xl p-3 mb-4"
          >
            {aiError}
          </motion.div>
        )}
        {validationError && (
          <div className="bg-[#ff009910] border border-[#ff0099]/30 text-[#ff0099] text-sm rounded-xl p-3 mb-4">
            {validationError}
          </div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#00ff8810] border border-[#00ff88]/30 text-[#00ff88] text-sm rounded-xl p-3 mb-4"
          >
            {successMsg}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CONFIG PREVIEW (shared by both AI and manual upload)                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">Config Preview</h3>
                {preview.meta?.aiGenerated && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#b44fff]/20 text-[#b44fff] font-bold">AI GENERATED</span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <Row label="Game ID" value={preview.meta.gameId} />
                <Row label="Type" value={preview.meta.gameType} />
                <Row label="Title" value={preview.meta.title} />
                <Row label="Difficulty" value={preview.meta.difficulty ?? "—"} />
                <Row label="Time Limit" value={preview.meta.timeLimit ? `${preview.meta.timeLimit}s` : "—"} />
                <Row label="Lives" value={preview.meta.lives ?? "—"} />
                {preview.meta.targetSkills && (
                  <Row label="Skills" value={
                    <div className="flex flex-wrap gap-1">
                      {preview.meta.targetSkills.map(s => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#00ff88]/10 text-[#00ff88] font-semibold">{s}</span>
                      ))}
                    </div>
                  } />
                )}
                {preview.config?.questions && (
                  <Row label="Questions" value={`${preview.config.questions.length} questions`} />
                )}
                {preview.config?.rounds && (
                  <Row label="Rounds" value={`${preview.config.rounds.length} rounds`} />
                )}
              </div>

              {/* Question list preview for MCQ */}
              {preview.config?.questions && (
                <details className="mt-3 border-t border-[#2a2a4a] pt-3">
                  <summary className="text-xs text-[#8888aa] cursor-pointer hover:text-white transition-colors font-semibold">
                    Preview Questions ({preview.config.questions.length})
                  </summary>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {preview.config.questions.map((q, i) => (
                      <div key={q.id || i} className="text-xs bg-[#0f0f1a] rounded-lg p-3 border border-[#2a2a4a]">
                        <p className="text-white font-medium mb-1">Q{i + 1}: {q.question}</p>
                        <p className="text-[#00ff88] text-[10px]">✓ {q.answer}</p>
                        {q.difficulty && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                            q.difficulty === "hard" ? "bg-[#ff0099]/10 text-[#ff0099]" :
                            q.difficulty === "easy" ? "bg-[#00ff88]/10 text-[#00ff88]" :
                            "bg-[#ffcc00]/10 text-[#ffcc00]"
                          }`}>
                            {q.difficulty}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Custom Meta Fields for Saving */}
              <div className="mt-4 pt-4 border-t border-[#2a2a4a] space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#8888aa] uppercase tracking-wider mb-1">Custom URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="e.g. my-cool-game"
                    className="w-full bg-[#0f0f1a] border border-[#2a2a4a] text-white p-2 rounded-lg focus:outline-none focus:border-[#00ff88] text-xs font-mono"
                  />
                  <p className="text-[#444466] text-[9px] mt-1 ml-1">Players will access this game at /game/{slug || "..."}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8888aa] uppercase tracking-wider mb-1">Author Name (Optional)</label>
                  <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="e.g. Creator123"
                    className="w-full bg-[#0f0f1a] border border-[#2a2a4a] text-white p-2 rounded-lg focus:outline-none focus:border-[#00ff88] text-xs"
                  />
                </div>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DIVIDER                                                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#2a2a4a]" />
          <span className="text-[10px] text-[#444466] uppercase tracking-widest font-bold">or upload manually</span>
          <div className="flex-1 h-px bg-[#2a2a4a]" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MANUAL UPLOAD SECTION                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="border-2 border-dashed border-[#2a2a4a] rounded-2xl p-8 text-center cursor-pointer hover:border-[#b44fff] transition-colors mb-4"
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="text-white font-semibold mb-1">Drop game config JSON here</p>
          <p className="text-[#8888aa] text-xs">or click to browse</p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>

        {/* Config format guide and download */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleDownloadSample}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/5 hover:bg-[#00ff88]/10 transition-colors font-bold text-sm"
          >
            ↓ Download Sample Config
          </button>

          <details className="border border-[#2a2a4a] rounded-xl bg-[#0f0f1a]/50">
            <summary className="px-5 py-4 text-sm text-[#8888aa] cursor-pointer hover:text-white transition-colors font-semibold flex items-center gap-2">
              <span>📖</span> How does the Plugin System work?
            </summary>
            <div className="px-5 pb-5 text-sm text-[#d0d0e0] leading-relaxed border-t border-[#2a2a4a] pt-3">
              <p className="mb-3">
                SkillArena uses a <strong>plug-and-play architecture</strong>. The engine never hardcodes game rules. Instead:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4 text-[#8888aa]">
                <li>You upload a JSON config outlining the game variants (like puzzles or questions).</li>
                <li>The engine reads <code className="text-[#b44fff] bg-[#b44fff]/10 px-1 rounded">meta.gameId</code> built into your JSON.</li>
                <li>It dynamically loads the React Plugin associated with that ID from <code className="text-[#b44fff] bg-[#b44fff]/10 px-1 rounded">PluginLoader.js</code>.</li>
              </ul>
              <p className="text-[#ffcc00] text-xs font-mono bg-[#ffcc00]/10 p-2 rounded">
                Currently supported gameIds: &quot;sudoku&quot;, &quot;word-builder&quot;, &quot;aptitude-blitz&quot;.
              </p>
            </div>
          </details>

          <details className="border border-[#2a2a4a] rounded-xl">
            <summary className="px-4 py-3 text-sm text-[#8888aa] cursor-pointer hover:text-white transition-colors font-medium">
              View config JSON schema
            </summary>
            <pre className="px-4 pb-4 text-xs text-[#8888aa] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border-t border-[#2a2a4a] pt-3">
{`{
  "meta": {
    "gameId":      "your-game",   // MUST match a registered plugin
    "gameType":    "mcq",         // grid | word | mcq | logic
    "title":       "My Game",
    "description": "...",
    "difficulty":  "medium",
    "timeLimit":   120,           // total seconds for the engine
    "lives":       3,             // mistakes allowed before Game Over
    "version":     "1.0",
    "targetSkills": ["skill1"],   // learning skills targeted
    "learningOutcome": "..."      // what the player learns
  },
  "config": {
    // arbitrary data passed directly to your React plugin
  }
}`}
            </pre>
          </details>
        </div>

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
    <div className="flex justify-between items-start">
      <span className="text-[#8888aa]">{label}</span>
      <span className="text-white font-medium text-right">{typeof value === "string" ? value : value}</span>
    </div>
  );
}
