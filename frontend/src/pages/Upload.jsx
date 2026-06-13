import React, { useState, useRef } from "react";
import api from "../api";
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, ClipboardType } from "lucide-react";

export default function Upload({ scope }) {
  const [mode, setMode] = useState("pdf"); // pdf | text
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [pastedTitle, setPastedTitle] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const reset = () => {
    setFile(null);
    setPastedText("");
    setPastedTitle("");
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  };

  const handleUploadPDF = async () => {
    if (!file) return;
    setStatus("loading");
    setErrorMsg("");
    const form = new FormData();
    form.append("file", file);
    form.append("scope", scope);
    try {
      const res = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || "Upload failed.");
      setStatus("error");
    }
  };

  const handleUploadText = async () => {
    if (!pastedText.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await api.post("/upload-text", {
        text: pastedText,
        title: pastedTitle || "Pasted Text",
        scope,
      });
      setResult(res.data);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || "Upload failed.");
      setStatus("error");
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Upload Knowledge</h1>
        <p className="text-muted text-sm mt-1">
          Add documents to the <span className="text-accent2 font-mono">{scope}</span> knowledge base
        </p>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => { setMode("pdf"); reset(); }}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            mode === "pdf" ? "bg-accent/15 border-accent/40 text-accent" : "border-line text-muted hover:text-white"
          }`}
        >
          <FileText size={14} className="inline mr-2" /> PDF Document
        </button>
        <button
          onClick={() => { setMode("text"); reset(); }}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            mode === "text" ? "bg-accent/15 border-accent/40 text-accent" : "border-line text-muted hover:text-white"
          }`}
        >
          <ClipboardType size={14} className="inline mr-2" /> Paste Text
        </button>
      </div>

      {mode === "pdf" ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-line rounded-xl p-10 text-center cursor-pointer hover:border-accent/50 transition-colors bg-panel"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <UploadCloud size={28} className="mx-auto text-muted mb-3" />
          {file ? (
            <p className="text-sm font-medium">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-medium">Drop a PDF here or click to browse</p>
              <p className="text-xs text-muted mt-1">Employee handbooks, policies, onboarding guides...</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-xl p-5 space-y-3">
          <input
            type="text"
            placeholder="Title (e.g. Remote Work Policy)"
            value={pastedTitle}
            onChange={(e) => setPastedTitle(e.target.value)}
            className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50"
          />
          <textarea
            rows={10}
            placeholder="Paste any text content here — Slack threads, policy text, notes..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50 resize-none font-mono"
          />
        </div>
      )}

      <button
        onClick={mode === "pdf" ? handleUploadPDF : handleUploadText}
        disabled={status === "loading" || (mode === "pdf" ? !file : !pastedText.trim())}
        className="mt-4 w-full bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Processing & indexing...
          </>
        ) : (
          "Upload to Knowledge Base"
        )}
      </button>

      {status === "success" && result && (
        <div className="mt-5 bg-accent2/10 border border-accent2/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent2 font-medium text-sm mb-2">
            <CheckCircle2 size={16} /> Indexed successfully
          </div>
          <p className="text-sm text-muted mb-2">
            <span className="text-white">{result.filename}</span> — {result.chunks} chunks embedded into ChromaDB
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {result.tags.map((t) => (
              <span key={t} className="tag-chip">{t}</span>
            ))}
          </div>
          <button onClick={reset} className="mt-3 text-xs text-accent underline">
            Upload another
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="mt-5 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}
    </div>
  );
}
