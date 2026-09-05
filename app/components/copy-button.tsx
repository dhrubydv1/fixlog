"use client";

import { useState } from "react";

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus("Copied"); }
    catch { setStatus("Select the text to copy it manually."); }
  }
  return <span className="fl-copy-control"><button type="button" onClick={copy} className="fl-button fl-button-small" aria-label={`Copy ${label.toLowerCase()}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></svg>{status === "Copied" ? "Copied" : "Copy"}</button><span role="status" className={status === "Copied" ? "sr-only" : "fl-copy-status"}>{status}</span></span>;
}
