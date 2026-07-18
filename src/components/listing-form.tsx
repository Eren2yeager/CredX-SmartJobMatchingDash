"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Plus, X } from "lucide-react";

export function ListingForm() {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  function addSkill(value: string) {
    const skill = value.trim().toLowerCase();
    if (skill && !skills.includes(skill)) setSkills((current) => [...current, skill]);
    setSkillInput("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"), company: form.get("company"), location: form.get("location"),
      workMode: form.get("workMode"), minGpa: Number(form.get("minGpa")),
      sponsorshipOffered: form.get("sponsorshipOffered") === "true",
      description: form.get("description"), requiredSkills: skills,
    };
    try {
      const response = await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(data.fields ?? {});
        throw new Error(data.error ?? "The role could not be published.");
      }
      router.push(`/recruiter/listings/${data._id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The role could not be published.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="surface space-y-7 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Role title" name="title" placeholder="Frontend Engineer" error={errors.title} />
          <Field label="Company" name="company" placeholder="Your company" error={errors.company} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Location" name="location" placeholder="Bengaluru or Remote" error={errors.location} />
          <div className="space-y-2"><label className="label" htmlFor="workMode">Work mode</label><select className="field" id="workMode" name="workMode" defaultValue="hybrid"><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option></select>{errors.workMode && <ErrorText text={errors.workMode} />}</div>
        </div>
        <div className="space-y-2">
          <label className="label" htmlFor="skills">Required skills</label>
          <div className="flex min-h-12 flex-wrap gap-2 rounded-lg border border-input bg-card p-2 focus-within:ring-2 focus-within:ring-ring">
            {skills.map((skill) => <span key={skill} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-bold">{skill}<button type="button" onClick={() => setSkills((items) => items.filter((item) => item !== skill))} aria-label={`Remove ${skill}`}><X className="size-3.5" /></button></span>)}
            <input id="skills" value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addSkill(skillInput); } }} onBlur={() => addSkill(skillInput)} placeholder="Type a skill and press Enter" className="min-w-44 flex-1 bg-transparent px-1 text-sm outline-none" />
          </div>
          <p className="helper">Use specific, job-relevant skills. These drive the largest part of the match score.</p>
          {errors.requiredSkills && <ErrorText text={errors.requiredSkills} />}
        </div>
        <div className="space-y-2"><label className="label" htmlFor="description">Role description</label><textarea className="field-area" id="description" name="description" placeholder="Describe the work, responsibilities, and what success looks like." maxLength={2000} />{errors.description && <ErrorText text={errors.description} />}</div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><label className="label" htmlFor="minGpa">Minimum GPA</label><input className="field" id="minGpa" name="minGpa" type="number" min="0" max="10" step="0.1" defaultValue="0" /><p className="helper">Enter 0 if GPA is not a requirement.</p>{errors.minGpa && <ErrorText text={errors.minGpa} />}</div>
          <div className="space-y-2"><label className="label" htmlFor="sponsorship">Visa sponsorship</label><select className="field" id="sponsorship" name="sponsorshipOffered" defaultValue="false"><option value="false">Not available</option><option value="true">Available</option></select>{errors.sponsorshipOffered && <ErrorText text={errors.sponsorshipOffered} />}</div>
        </div>
        {message && <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">{message}</p>}
      </div>

      <aside className="surface p-6 lg:sticky lg:top-24">
        <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground"><Check className="size-5" /></span>
        <h2 className="mt-5 text-xl font-bold">Ready to publish?</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Your listing becomes visible immediately and matches are calculated in the background.</p>
        <div className="mt-6 rounded-xl bg-muted p-4 text-xs leading-5 text-muted-foreground"><p className="font-bold text-foreground">A strong role includes</p><ul className="mt-2 space-y-1.5"><li>A clear, recognizable title</li><li>Only essential skill requirements</li><li>A practical description of the work</li><li>Accurate location and sponsorship details</li></ul></div>
        <button type="submit" disabled={saving} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:brightness-95 active:translate-y-px disabled:opacity-60">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{saving ? "Publishing role" : "Publish role"}</button>
      </aside>
    </form>
  );
}

function Field({ label, name, placeholder, error }: { label: string; name: string; placeholder: string; error?: string }) {
  return <div className="space-y-2"><label className="label" htmlFor={name}>{label}</label><input className="field" id={name} name={name} placeholder={placeholder} />{error && <ErrorText text={error} />}</div>;
}

function ErrorText({ text }: { text: string }) { return <p className="text-xs font-semibold text-destructive">{text}</p>; }
