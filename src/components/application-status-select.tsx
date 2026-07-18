"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

export function ApplicationStatusSelect({ applicationId, initialStatus }: { applicationId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function update(nextStatus: string) {
    const previous = status;
    setStatus(nextStatus);
    setSaving(true);
    setSaved(false);
    const response = await fetch("/api/applications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId, status: nextStatus }) });
    if (!response.ok) setStatus(previous);
    else { setSaved(true); window.setTimeout(() => setSaved(false), 1800); }
    setSaving(false);
  }

  return <div className="flex items-center gap-2"><select aria-label="Application status" className="field h-9 min-w-36 py-0 text-xs font-bold" value={status} disabled={saving} onChange={(event) => update(event.target.value)}><option value="applied" disabled>Applied</option><option value="under_review">Under review</option><option value="accepted">Accepted</option><option value="rejected">Not selected</option></select>{saving ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : saved ? <Check className="size-4 text-success" /> : null}</div>;
}
