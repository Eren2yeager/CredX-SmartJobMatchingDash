/**
 * Seed script: inserts 15–20 realistic job listings for demo/judging.
 * Run with: bun run scripts/seed.ts
 *
 * ponytail: flat array + loop — no abstractions, no helpers. Simplest thing that works.
 */

import { connectDB } from "../src/lib/db";
import Listing from "../src/modules/listings/listing.model";

// Skills by domain — drawn from ≥4 distinct technical domains (frontend, backend, data, devops)
// All lowercase per model convention.
const listings = [
  // --- Company: Google ---
  {
    title: "Frontend Engineer",
    company: "Google",
    requiredSkills: ["react", "typescript", "css", "html", "next.js"],
    minGpa: 3.5,
    location: "Mountain View, CA",
    workMode: "hybrid" as const,
    sponsorshipOffered: true,
    description: "Build responsive, accessible UIs for Google's consumer products. You'll work closely with design and backend teams to ship high-quality features at scale.",
  },
  {
    title: "Backend Engineer",
    company: "Google",
    requiredSkills: ["go", "python", "rest api", "kubernetes", "docker"],
    minGpa: 3.7,
    location: "New York, NY",
    workMode: "onsite" as const,
    sponsorshipOffered: false,
    description: "Design and implement distributed backend services powering Google's infrastructure. Strong understanding of concurrency and system design required.",
  },

  // --- Company: Meta ---
  {
    title: "Data Engineer",
    company: "Meta",
    requiredSkills: ["sql", "python", "pandas", "data analysis", "postgresql"],
    minGpa: 3.2,
    location: "Menlo Park, CA",
    workMode: "remote" as const,
    sponsorshipOffered: true,
    description: "Build and maintain data pipelines that power Meta's analytics platform. Experience with large-scale data processing and SQL optimization is key.",
  },
  {
    title: "Machine Learning Engineer",
    company: "Meta",
    requiredSkills: ["python", "machine learning", "numpy", "pandas", "docker"],
    minGpa: 3.8,
    location: "Seattle, WA",
    workMode: "hybrid" as const,
    sponsorshipOffered: false,
    description: "Train and deploy ML models for ranking, recommendations, and integrity systems at Meta scale.",
  },

  // --- Company: Stripe ---
  {
    title: "Full Stack Engineer",
    company: "Stripe",
    requiredSkills: ["react", "node.js", "typescript", "postgresql", "rest api"],
    minGpa: 3.0,
    location: "San Francisco, CA",
    workMode: "hybrid" as const,
    sponsorshipOffered: true,
    description: "Work across the stack on Stripe's dashboard and API products. You'll own features end-to-end from design through production.",
  },
  {
    title: "DevOps Engineer",
    company: "Stripe",
    requiredSkills: ["aws", "terraform", "kubernetes", "docker", "ci/cd", "linux"],
    minGpa: 2.9,
    location: "Remote",
    workMode: "remote" as const,
    sponsorshipOffered: false,
    description: "Own Stripe's cloud infrastructure and deployment pipelines. Drive reliability and scalability of payment processing systems.",
  },
  {
    title: "Backend Engineer",
    company: "Stripe",
    requiredSkills: ["java", "spring boot", "rest api", "postgresql", "docker"],
    minGpa: 3.4,
    location: "Chicago, IL",
    workMode: "onsite" as const,
    sponsorshipOffered: true,
    description: "Build core payment processing APIs and internal tooling used by millions of developers worldwide.",
  },

  // --- Company: Notion ---
  {
    title: "Frontend Engineer",
    company: "Notion",
    requiredSkills: ["react", "typescript", "tailwind", "html", "css"],
    minGpa: 2.8,
    location: "San Francisco, CA",
    workMode: "onsite" as const,
    sponsorshipOffered: false,
    description: "Craft beautiful, performant editor experiences for Notion's web app. Deep knowledge of React rendering and state management expected.",
  },
  {
    title: "Data Analyst",
    company: "Notion",
    requiredSkills: ["sql", "data analysis", "python", "postgresql"],
    minGpa: 2.5,
    location: "Remote",
    workMode: "remote" as const,
    sponsorshipOffered: true,
    description: "Analyze product usage metrics and growth data to help Notion's teams make informed, data-driven decisions.",
  },

  // --- Company: Cloudflare ---
  {
    title: "Site Reliability Engineer",
    company: "Cloudflare",
    requiredSkills: ["linux", "kubernetes", "docker", "ci/cd", "aws", "gcp"],
    minGpa: 3.1,
    location: "Austin, TX",
    workMode: "hybrid" as const,
    sponsorshipOffered: false,
    description: "Ensure the reliability, performance, and security of Cloudflare's global network edge infrastructure.",
  },
  {
    title: "Backend Engineer",
    company: "Cloudflare",
    requiredSkills: ["go", "rust", "rest api", "docker", "linux"],
    minGpa: 3.6,
    location: "Remote",
    workMode: "remote" as const,
    sponsorshipOffered: true,
    description: "Build the systems that protect and accelerate internet traffic at Cloudflare's planetary scale.",
  },

  // --- Company: Vercel ---
  {
    title: "Frontend Engineer",
    company: "Vercel",
    requiredSkills: ["next.js", "react", "typescript", "node.js", "tailwind"],
    minGpa: 3.3,
    location: "Remote",
    workMode: "remote" as const,
    sponsorshipOffered: true,
    description: "Improve the developer experience of Next.js and Vercel's deployment platform used by hundreds of thousands of developers.",
  },
  {
    title: "Cloud Infrastructure Engineer",
    company: "Vercel",
    requiredSkills: ["aws", "gcp", "terraform", "kubernetes", "ci/cd", "docker"],
    minGpa: 3.5,
    location: "Remote",
    workMode: "remote" as const,
    sponsorshipOffered: false,
    description: "Design and scale the multi-cloud deployment infrastructure powering Vercel's serverless platform.",
  },

  // --- Company: Figma ---
  {
    title: "Full Stack Engineer",
    company: "Figma",
    requiredSkills: ["typescript", "react", "node.js", "postgresql", "rest api"],
    minGpa: 2.7,
    location: "San Francisco, CA",
    workMode: "onsite" as const,
    sponsorshipOffered: false,
    description: "Build collaborative editing features and integrations for Figma's design platform.",
  },
  {
    title: "Machine Learning Intern",
    company: "Figma",
    requiredSkills: ["python", "machine learning", "numpy", "data analysis", "sql"],
    minGpa: 3.9,
    location: "New York, NY",
    workMode: "hybrid" as const,
    sponsorshipOffered: true,
    description: "Explore ML applications in design tooling — auto-layout suggestions, smart naming, and content-aware features.",
  },
  {
    title: "Data Engineer",
    company: "Figma",
    requiredSkills: ["sql", "postgresql", "python", "pandas", "mongodb"],
    minGpa: 3.0,
    location: "Seattle, WA",
    workMode: "hybrid" as const,
    sponsorshipOffered: false,
    description: "Build the data foundations that Figma's product and growth teams rely on for decision-making.",
  },
] satisfies Array<{
  title: string;
  company: string;
  requiredSkills: string[];
  minGpa: number;
  location: string;
  workMode: "remote" | "onsite" | "hybrid";
  sponsorshipOffered: boolean;
  description: string;
}>;

async function seed() {
  try {
    await connectDB();
  } catch (err) {
    console.error("Seed failed: could not connect to DB:", err);
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;

  for (const data of listings) {
    // Idempotency: skip if (title, company) already exists (case-insensitive)
    const exists = await Listing.findOne({
      title: { $regex: `^${data.title}$`, $options: "i" },
      company: { $regex: `^${data.company}$`, $options: "i" },
    });

    if (exists) {
      skipped++;
      continue;
    }

    await Listing.create({ ...data, recruiterId: null });
    inserted++;
  }

  console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed with unexpected error:", err);
  process.exit(1);
});
