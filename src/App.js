import React, { useState } from "react";
import "./App.css";

// Helper: pretty section renderer
function Section({ title, content }) {
  const [open, setOpen] = useState(true);

  const renderContent = () => {
    if (Array.isArray(content)) {
      return (
        <ul>
          {content.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    }
    if (typeof content === "object" && content !== null) {
      return (
        <div className="kv">
          {Object.entries(content).map(([k, v]) => (
            <div key={k} className="kv-row">
              <span className="kv-key">{k}</span>
              <span className="kv-val">
                {Array.isArray(v) ? v.join(", ") : String(v)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return <p>{String(content)}</p>;
  };

  return (
    <div className="section">
      <button className="section-toggle" onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} {title}
      </button>
      {open && <div className="section-body">{renderContent()}</div>}
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setError("");
    setSummary(null);

    const formData = new FormData();
    formData.append("file", file); // must match backend field name

    try {
      // Use full backend URL to avoid proxy/CORS confusion
      const res = await fetch("http://localhost:5000/api/v1/summary/extract", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const renderSummary = () => {
    if (!summary) return null;

    // If the response is a dictionary of sections, render each section nicely
    if (typeof summary === "object" && !Array.isArray(summary)) {
      return (
        <div className="summary">
          <h2>Structured Summary</h2>
          {Object.entries(summary).map(([sectionTitle, content]) => (
            <Section key={sectionTitle} title={sectionTitle} content={content} />
          ))}
        </div>
      );
    }

    // Fallback: raw JSON
    return (
      <div className="summary">
        <h2>Structured Summary</h2>
        <pre>{JSON.stringify(summary, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="App">
      <h1>OCR Summary Generator</h1>

      <div className="uploader">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Upload and Summarize"}
        </button>
      </div>

      {error && <p className="error">Error: {error}</p>}
      {renderSummary()}
    </div>
  );
}

export default App;
