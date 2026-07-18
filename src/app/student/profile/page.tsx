"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Plus, Upload, Loader2, Check } from "lucide-react";

type WorkAuthStatus =
  | "citizen"
  | "permanent_resident"
  | "visa_sponsorship_required"
  | "other";

interface StudentProfile {
  _id: string;
  userId: string;
  skills: string[];
  gpa?: number;
  workAuthStatus?: WorkAuthStatus;
  location?: string;
  resumeUrl?: string;
  resumeParsedSkills: string[];
  createdAt: string;
  updatedAt: string;
}

const WORK_AUTH_LABELS: Record<WorkAuthStatus, string> = {
  citizen: "Citizen",
  permanent_resident: "Permanent Resident",
  visa_sponsorship_required: "Visa Sponsorship Required",
  other: "Other",
};

export default function StudentProfilePage() {
  // Profile fetch state
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form fields
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [gpa, setGpa] = useState("");
  const [workAuthStatus, setWorkAuthStatus] = useState<WorkAuthStatus | "">("");
  const [location, setLocation] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | undefined>(undefined);

  // Resume parse state
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(
    new Set()
  );

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load profile on mount ─────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        if (res.status === 404) {
          setProfileExists(false);
          return;
        }
        if (!res.ok) {
          setFetchError("Failed to load profile.");
          return;
        }
        const data: StudentProfile = await res.json();
        setProfileExists(true);
        setSkills(data.skills ?? []);
        setGpa(data.gpa != null ? String(data.gpa) : "");
        setWorkAuthStatus(data.workAuthStatus ?? "");
        setLocation(data.location ?? "");
        setResumeUrl(data.resumeUrl);
        // Show previously parsed skills that haven't been merged yet
        const unmerged = (data.resumeParsedSkills ?? []).filter(
          (s) => !data.skills.includes(s)
        );
        setSuggestedSkills(unmerged);
      })
      .catch(() => setFetchError("Network error. Please try again."))
      .finally(() => setLoadingProfile(false));
  }, []);

  // ── Skill tag input ───────────────────────────────────────────────────────

  function addSkill(raw: string) {
    const skill = raw.trim().toLowerCase();
    if (skill && !skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
    }
    setSkillInput("");
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === "Backspace" && skillInput === "" && skills.length > 0) {
      setSkills((prev) => prev.slice(0, -1));
    }
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  // ── Suggested skills (from resume parse) ─────────────────────────────────

  function acceptSuggestion(skill: string) {
    setAcceptedSuggestions((prev) => new Set(prev).add(skill));
    if (!skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
    }
  }

  function acceptAllSuggestions() {
    const toAdd = suggestedSkills.filter((s) => !skills.includes(s));
    setSkills((prev) => [...prev, ...toAdd]);
    setAcceptedSuggestions(new Set(suggestedSkills));
  }

  // ── Resume upload ─────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeError(null);
    setResumeUploading(true);
    setSuggestedSkills([]);
    setAcceptedSuggestions(new Set());

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/resume-parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setResumeError(data.error ?? "Resume upload failed.");
        return;
      }

      const { resumeUrl: url, parsedSkills } = await res.json();
      setResumeUrl(url);
      // Only show suggestions for skills not already in the list
      setSuggestedSkills(
        (parsedSkills as string[]).filter((s) => !skills.includes(s))
      );
    } catch {
      setResumeError("Network error during upload.");
    } finally {
      setResumeUploading(false);
      // Reset so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Form submit ───────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    setSubmitSuccess(false);
    setSubmitting(true);

    const body: Record<string, unknown> = {
      skills,
      gpa: gpa !== "" ? parseFloat(gpa) : undefined,
      workAuthStatus: workAuthStatus || undefined,
      location: location || undefined,
    };

    // Include resumeUrl in update if we have one
    if (resumeUrl) body.resumeUrl = resumeUrl;

    try {
      const res = await fetch("/api/profile", {
        method: profileExists ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 422) {
        const data = await res.json();
        setFieldErrors(data.fields ?? {});
        setSubmitError(data.error ?? "Validation failed.");
        return;
      }

      if (res.status === 409) {
        // Profile already exists — switch to update mode and retry
        setProfileExists(true);
        setSubmitError("Profile already exists. Retrying as update…");
        return;
      }

      if (!res.ok) {
        setSubmitError("Something went wrong. Please try again.");
        return;
      }

      setProfileExists(true);
      setSubmitSuccess(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-background p-6 md:p-10">
        <div className="mx-auto max-w-xl animate-pulse space-y-4">
          <div className="h-7 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="mt-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="min-h-screen bg-background p-6 md:p-10">
        <div className="mx-auto max-w-xl">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {fetchError}
          </div>
        </div>
      </main>
    );
  }

  const disabled = submitting;

  return (
    <main className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            {profileExists ? "Update Profile" : "Create Profile"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profileExists
              ? "Keep your skills and details up to date."
              : "Tell us about yourself to get matched with listings."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Skills ──────────────────────────────────────────────────── */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Skills
            </label>
            <div
              className={cn(
                "flex min-h-[42px] flex-wrap gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring/50",
                fieldErrors.skills ? "border-destructive" : "border-input"
              )}
            >
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    disabled={disabled}
                    className="hover:text-destructive disabled:pointer-events-none"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={() => skillInput.trim() && addSkill(skillInput)}
                placeholder={skills.length === 0 ? "Type a skill and press Enter" : ""}
                disabled={disabled}
                className="min-w-[140px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              />
            </div>
            {fieldErrors.skills && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.skills}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Press Enter or comma to add a skill.
            </p>
          </div>

          {/* ── GPA ─────────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="gpa"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              GPA <span className="text-muted-foreground font-normal">(0.0 – 10.0)</span>
            </label>
            <input
              id="gpa"
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              disabled={disabled}
              placeholder="e.g. 8.5"
              className={cn(
                "h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                fieldErrors.gpa ? "border-destructive" : "border-input"
              )}
            />
            {fieldErrors.gpa && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.gpa}</p>
            )}
          </div>

          {/* ── Work Auth Status ─────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="workAuthStatus"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Work Authorization
            </label>
            <select
              id="workAuthStatus"
              value={workAuthStatus}
              onChange={(e) =>
                setWorkAuthStatus(e.target.value as WorkAuthStatus | "")
              }
              disabled={disabled}
              className={cn(
                "h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                fieldErrors.workAuthStatus ? "border-destructive" : "border-input"
              )}
            >
              <option value="">Select status…</option>
              {(Object.keys(WORK_AUTH_LABELS) as WorkAuthStatus[]).map((val) => (
                <option key={val} value={val}>
                  {WORK_AUTH_LABELS[val]}
                </option>
              ))}
            </select>
            {fieldErrors.workAuthStatus && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.workAuthStatus}
              </p>
            )}
          </div>

          {/* ── Location ─────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="location"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Location{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={disabled}
              placeholder="e.g. San Francisco, CA"
              className={cn(
                "h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                fieldErrors.location ? "border-destructive" : "border-input"
              )}
            />
            {fieldErrors.location && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.location}</p>
            )}
          </div>

          {/* ── Resume Upload ─────────────────────────────────────────────── */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Resume{" "}
              <span className="text-muted-foreground font-normal">(PDF, optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || resumeUploading}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {resumeUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {resumeUploading ? "Uploading…" : resumeUrl ? "Replace Resume" : "Upload Resume"}
              </button>
              {resumeUrl && !resumeUploading && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  View current
                </a>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {resumeError && (
              <p className="mt-1.5 text-xs text-destructive">{resumeError}</p>
            )}
          </div>

          {/* ── Suggested skills from resume ──────────────────────────────── */}
          {suggestedSkills.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Suggested skills from your resume:
                </p>
                <button
                  type="button"
                  onClick={acceptAllSuggestions}
                  className="text-xs font-medium text-primary hover:underline underline-offset-2"
                >
                  Add all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.map((skill) => {
                  const accepted = acceptedSuggestions.has(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => !accepted && acceptSuggestion(skill)}
                      disabled={accepted}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        accepted
                          ? "border-transparent bg-secondary/50 text-muted-foreground line-through cursor-default"
                          : "border-border bg-background text-foreground hover:bg-secondary hover:border-primary/40"
                      )}
                    >
                      {accepted ? (
                        <Check className="size-3 text-green-600" />
                      ) : (
                        <Plus className="size-3" />
                      )}
                      {skill}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Click a skill to add it to your profile. Changes only save when you submit.
              </p>
            </div>
          )}

          {/* ── Submit ───────────────────────────────────────────────────── */}
          {submitError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              Profile {profileExists ? "updated" : "created"} successfully.
            </div>
          )}

          <Button type="submit" disabled={disabled} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : profileExists ? (
              "Update Profile"
            ) : (
              "Create Profile"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
