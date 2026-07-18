"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, FileText, LoaderCircle, Plus, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkAuth = "citizen" | "permanent_resident" | "visa_sponsorship_required" | "other";
type Profile = { skills: string[]; gpa?: number; workAuthStatus?: WorkAuth; location?: string; resumeUrl?: string; resumeParsedSkills?: string[] };

const authLabels: Record<WorkAuth, string> = {
  citizen: "Citizen",
  permanent_resident: "Permanent resident",
  visa_sponsorship_required: "Visa sponsorship required",
  other: "Other",
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [gpa, setGpa] = useState("");
  const [workAuthStatus, setWorkAuthStatus] = useState<WorkAuth | "">("");
  const [location, setLocation] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        if (response.status === 404) return;
        if (!response.ok) throw new Error();
        const profile = (await response.json()) as Profile;
        setExists(true);
        setSkills(profile.skills ?? []);
        setGpa(profile.gpa === undefined ? "" : String(profile.gpa));
        setWorkAuthStatus(profile.workAuthStatus ?? "");
        setLocation(profile.location ?? "");
        setResumeUrl(profile.resumeUrl ?? "");
        setSuggestions((profile.resumeParsedSkills ?? []).filter((skill) => !profile.skills.includes(skill)));
      })
      .catch(() => setMessage({ tone: "error", text: "We could not load your profile. Refresh to try again." }))
      .finally(() => setLoading(false));
  }, []);

  function addSkill(value: string) {
    const skill = value.trim().toLowerCase();
    if (skill && !skills.includes(skill)) setSkills((current) => [...current, skill]);
    setSkillInput("");
  }

  async function uploadResume(file?: File) {
    if (!file) return;
    const acceptedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!acceptedTypes.includes(file.type)) {
      setMessage({ tone: "error", text: "Please choose a PDF, DOCX, PNG, JPEG, or WebP resume." });
      return;
    }
    setUploading(true);
    setMessage(null);
    const body = new FormData();
    body.append("resume", file);
    try {
      const response = await fetch("/api/resume-parse", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Resume upload failed.");
      setResumeUrl(data.resumeUrl);
      setSuggestions((data.parsedSkills as string[]).filter((skill) => !skills.includes(skill)));
      setMessage({
        tone: "success",
        text: data.analysisWarning ?? "Resume uploaded. Review the suggested skills before saving.",
      });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Resume upload failed." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: exists ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills,
          gpa: gpa ? Number(gpa) : undefined,
          workAuthStatus: workAuthStatus || undefined,
          location: location || undefined,
          resumeUrl: resumeUrl || undefined,
          resumeParsedSkills: suggestions,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(data.fields ?? {});
        throw new Error(data.error ?? "Your profile could not be saved.");
      }
      setExists(true);
      setMessage({ tone: "success", text: "Profile saved. Your matches are being refreshed." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Your profile could not be saved." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="app-container py-14"><div className="skeleton h-12 w-72" /><div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]"><div className="skeleton h-[620px]" /><div className="skeleton h-80" /></div></main>;

  return (
    <main className="app-container py-10 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-5xl tracking-wide sm:text-6xl">YOUR PROFILE</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Keep your evidence current. Small updates can change which roles rise to the top.</p>
        </div>
        <Link href="/student/dashboard" className="text-sm font-bold text-primary hover:underline">View matches</Link>
      </div>

      <form onSubmit={save} className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="surface space-y-7 p-6 sm:p-8">
          <div className="space-y-2">
            <label className="label" htmlFor="skills">Skills</label>
            <div className={cn("flex min-h-12 flex-wrap gap-2 rounded-lg border bg-card p-2", errors.skills ? "border-destructive" : "border-input", "focus-within:ring-2 focus-within:ring-ring")}>
              {skills.map((skill) => <span key={skill} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-bold">{skill}<button type="button" onClick={() => setSkills((items) => items.filter((item) => item !== skill))} aria-label={`Remove ${skill}`} className="rounded hover:text-destructive"><X className="size-3.5" /></button></span>)}
              <input id="skills" value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addSkill(skillInput); } }} onBlur={() => addSkill(skillInput)} placeholder={skills.length ? "Add another skill" : "Type a skill and press Enter"} className="min-w-40 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <p className="helper">Use specific skills such as React, SQL, user research, or financial modeling.</p>
            {errors.skills && <p className="text-xs font-semibold text-destructive">{errors.skills}</p>}
          </div>

          {suggestions.length > 0 && <div className="rounded-xl bg-accent p-4"><div className="flex items-center justify-between gap-4"><p className="text-sm font-bold text-accent-foreground">Suggested from your resume</p><button type="button" onClick={() => { setSkills((items) => [...new Set([...items, ...suggestions])]); setSuggestions([]); }} className="text-xs font-bold text-accent-foreground hover:underline">Add all</button></div><div className="mt-3 flex flex-wrap gap-2">{suggestions.map((skill) => <button key={skill} type="button" onClick={() => { addSkill(skill); setSuggestions((items) => items.filter((item) => item !== skill)); }} className="inline-flex items-center gap-1 rounded-lg bg-card px-2.5 py-1.5 text-xs font-bold"><Plus className="size-3" />{skill}</button>)}</div></div>}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><label className="label" htmlFor="gpa">GPA</label><input id="gpa" className="field" type="number" min="0" max="10" step="0.1" value={gpa} onChange={(event) => setGpa(event.target.value)} placeholder="8.4" /><p className="helper">Use your GPA on a 10-point scale.</p>{errors.gpa && <p className="text-xs font-semibold text-destructive">{errors.gpa}</p>}</div>
            <div className="space-y-2"><label className="label" htmlFor="location">Preferred location</label><input id="location" className="field" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Bengaluru or remote" /><p className="helper">Add a city, region, or remote preference.</p></div>
          </div>

          <div className="space-y-2"><label className="label" htmlFor="workAuth">Work authorization</label><select id="workAuth" className="field" value={workAuthStatus} onChange={(event) => setWorkAuthStatus(event.target.value as WorkAuth | "")}><option value="">Choose your status</option>{Object.entries(authLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p className="helper">This prevents roles without compatible sponsorship from being ranked too highly.</p>{errors.workAuthStatus && <p className="text-xs font-semibold text-destructive">{errors.workAuthStatus}</p>}</div>

          {message && <div role="status" className={cn("flex gap-2 rounded-xl p-4 text-sm font-semibold", message.tone === "success" ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive")}>{message.tone === "success" ? <Check className="size-5 shrink-0" /> : <X className="size-5 shrink-0" />}{message.text}</div>}

          <button type="submit" disabled={saving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:brightness-95 active:translate-y-px disabled:opacity-60">{saving && <LoaderCircle className="size-4 animate-spin" />}{saving ? "Saving profile" : exists ? "Save changes" : "Create profile"}</button>
        </div>

        <aside className="surface p-6 lg:sticky lg:top-24">
          <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground"><FileText className="size-5" /></span>
          <h2 className="mt-5 text-xl font-bold">Resume intelligence</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Upload a PDF, DOCX, or clear resume image and CredX will suggest skills for you to approve.</p>
          <input ref={fileRef} type="file" accept=".pdf,.docx,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => uploadResume(event.target.files?.[0])} />
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-bold hover:bg-muted disabled:opacity-60">{uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}{uploading ? "Analyzing resume" : resumeUrl ? "Replace resume" : "Upload resume"}</button>
          {resumeUrl && <a href={resumeUrl} target="_blank" rel="noreferrer" className="mt-3 block text-center text-xs font-bold text-primary hover:underline">View current resume</a>}
          <div className="mt-6 rounded-xl bg-muted p-4"><p className="text-xs font-bold">Before you upload</p><ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground"><li>PDF, DOCX, PNG, JPEG, or WebP</li><li>Maximum file size: 5 MB</li><li>Images should be clear and easy to read</li><li>You choose which suggestions to keep</li></ul></div>
        </aside>
      </form>
    </main>
  );
}
