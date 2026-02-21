"use client";
import { useState, useRef } from "react";
import { saveQuestionSetWithData } from "../../lib/firestoreHelpers";
import { validateQuestionSet } from "../../engine/questionLoader";

function generateSetId() {
  return `set_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function AdminPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadedSetId, setUploadedSetId] = useState("");
  const fileRef = useRef();

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setValidationError("");
    setSuccessMsg("");
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        validateQuestionSet(data);
        setPreview(data);
      } catch (err) {
        setValidationError(err.message);
        setPreview(null);
      }
    };
    reader.readAsText(f);
  }

  async function handleUpload() {
    if (!file || !preview || validationError) return;

    setUploading(true);
    setSuccessMsg("");
    try {
      const setId = generateSetId();
      // Store the full question set directly in Firestore — no Storage needed
      await saveQuestionSetWithData(setId, preview);

      setUploadedSetId(setId);
      setSuccessMsg(`✓ Uploaded "${preview.meta.title}" with ${preview.questions.length} questions!`);
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setValidationError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <a href="/" className="text-[#8888aa] text-sm hover:text-[#00ff88] transition-colors">
          ← Back to SkillArena
        </a>
        <h1 className="text-3xl font-black mt-3 mb-1">
          <span className="text-[#b44fff]">Admin</span> Panel
        </h1>
        <p className="text-[#8888aa]">Upload a new JSON question set. Zero code changes needed.</p>
      </div>

      {/* Upload card */}
      <div className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-6 mb-6">
        <h2 className="text-sm uppercase tracking-widest text-[#8888aa] mb-4 font-semibold">
          Upload Question Set
        </h2>

        {/* Drop zone */}
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#2a2a4a] rounded-xl cursor-pointer hover:border-[#b44fff] hover:bg-[#b44fff08] transition-all mb-4">
          <span className="text-3xl mb-2">📁</span>
          <span className="text-[#8888aa] text-sm">
            {file ? file.name : "Click or drag a .json file here"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Validation error */}
        {validationError && (
          <div className="mb-4 p-3 bg-[#ff009911] border border-[#ff009933] rounded-xl text-[#ff0099] text-sm">
            ✗ {validationError}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="mb-4 p-4 bg-[#0f0f1a] rounded-xl border border-[#00ff8833]">
            <p className="text-[#00ff88] text-sm font-semibold mb-2">✓ Valid JSON — Preview</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <PreviewRow label="Title" value={preview.meta.title} />
              <PreviewRow label="Category" value={preview.meta.category} />
              <PreviewRow label="Difficulty" value={preview.meta.difficulty} />
              <PreviewRow label="Questions" value={preview.questions.length} />
              <PreviewRow label="Time / Q" value={`${preview.meta.timePerQuestion ?? 15}s`} />
              <PreviewRow label="Lives" value={preview.meta.totalLives ?? 3} />
            </div>
          </div>
        )}

        <button
          disabled={!preview || uploading || !!validationError}
          onClick={handleUpload}
          className={`w-full py-3.5 rounded-xl font-black transition-all ${
            !preview || uploading || validationError
              ? "bg-[#2a2a4a] text-[#44446a] cursor-not-allowed"
              : "bg-[#b44fff] text-white hover:shadow-[0_0_20px_#b44fff88] active:scale-95"
          }`}
        >
          {uploading ? "Uploading…" : "Upload to Firebase →"}
        </button>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="p-4 bg-[#00ff8811] border border-[#00ff8833] rounded-xl text-[#00ff88] text-sm">
          <p className="font-bold mb-1">{successMsg}</p>
          <p className="text-[#8888aa] text-xs font-mono">Set ID: {uploadedSetId}</p>
          <p className="text-[#8888aa] text-xs mt-1">
            Players can now select this question set when creating a room.
          </p>
        </div>
      )}

      {/* Schema reference */}
      <div className="mt-8 bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-6">
        <h2 className="text-sm uppercase tracking-widest text-[#8888aa] mb-3 font-semibold">
          JSON Schema Reference
        </h2>
        <pre className="text-xs text-[#8888aa] overflow-x-auto bg-[#0f0f1a] p-4 rounded-xl leading-relaxed">
{`{
  "meta": {
    "title": "Aptitude Week 1",
    "category": "Aptitude",
    "difficulty": "medium",
    "timePerQuestion": 15,
    "totalLives": 3,
    "version": "1.0"
  },
  "questions": [
    {
      "id": "q1",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "B",
      "topic": "Percentages",
      "points": 10,
      "explanation": "..."
    }
  ]
}`}
        </pre>
      </div>
    </main>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div>
      <span className="text-[#8888aa] text-xs uppercase tracking-widest">{label}</span>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}
