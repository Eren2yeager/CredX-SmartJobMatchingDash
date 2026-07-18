# CredX: Smart Job Matching Dashboard

CredX is a skill-first career matching platform designed to connect students with relevant **job and internship** opportunities and provide recruiters with a pipeline of qualified candidates. It moves beyond simple keyword matching by employing a weighted scoring engine that transparently evaluates compatibility based on skills, GPA, and work authorization — surfacing a **ranked, explainable** set of recommendations rather than just a filtered list.

Live Site :) https://cred-x-smart-job-matching-dash.vercel.app/

## Key Features

### For Students
- **AI-Powered Resume Parsing:** Upload a PDF resume to have technical skills automatically extracted using the Groq API.
- **Tagged, Multi-Select Skill Profile:** Build a profile with skills chosen from a tagged, multi-select interface, alongside GPA and work authorization / visa sponsorship status.
- **Intelligent Job & Internship Matching:** Receive a ranked list of job and internship matches, each with a transparent score (0–100%) and a detailed breakdown of skill fit, GPA compatibility, and work-authorization fit — an explain-the-match view (e.g. "Matched on: React, SQL, GPA above threshold").
- **Advanced Filtering:** Filter matches by **role**, location, work mode (remote, hybrid, onsite), and visa sponsorship availability.
- **Comprehensive Application Tracking:** Mark listings as applied and track status (Under Review, Accepted, Rejected) from a centralized dashboard — going beyond the baseline stretch goal by making this a fully core, always-on feature.
- **Dynamic Profile Management:** Create and update a detailed profile with your skills, GPA, location, and work authorization status to continuously refine match results.

### For Recruiters
- **Structured Job Creation:** Post detailed job or internship listings with specific requirements for role/title, skills, GPA, location, work mode, and visa sponsorship.
- **Applicant Pipeline (Recruiter-Side Match View):** View every candidate who applied to a posting, complete with profile information and match score — satisfying the "see which students match a posting" bonus goal.
- **Application Management:** Update the status of each application (e.g., Under Review, Accepted, Rejected) directly from the pipeline view.
- **Recruiter Dashboard:** Get an at-a-glance overview of your active listings, total applicants, and applications currently under review.

## Matching Engine Explained
The core of CredX is its `scoreEngine`, which calculates a personalized match score for each student-listing pairing. The final score is a weighted sum of three key factors:

- **Skill Overlap (60%):** Calculated using the Jaccard similarity index between the student's skills and the listing's required skills.
- **GPA Fit (25%):** A score based on how the student's GPA compares to the minimum requirement, with a linear decay for GPAs below the threshold.
- **Work Authorization (15%):** A binary score indicating whether the student's visa requirements are compatible with the sponsorship offered by the role.

A hard cap is applied to the final score if work authorization is incompatible, ensuring that these critical mismatches are clearly flagged while keeping near-misses visible. Results are returned as a **ranked list, sorted by match score** (not just a filtered set), and each result carries the per-factor breakdown described above so the "why" behind a match is always visible — directly targeting the core challenge of a genuinely useful, explainable matching experience.

## Problem Statement Alignment

### Evaluation Criteria
| Criterion | How CredX addresses it |
|---|---|
| Correctness & sensibility of match-score logic | Weighted rule-based `scoreEngine` (60/25/15 skill/GPA/work-auth split) with a hard cap on work-auth mismatches; unit-tested with Vitest. |
| End-to-end functionality | Profile creation → resume parsing → matching → filtered/sorted results → application tracking, with no manual/admin steps required in between. |
| Usability of filters & clarity of match score | Filters for role, location, work mode, and sponsorship; each listing card shows a numeric score plus a factor-level breakdown. |
| Code quality & API design | RESTful, resource-oriented API surface (`/api/listings`, `/api/profile`, `/api/match`, `/api/applications`) built on typed Next.js route handlers. |

### Bonus / Stretch Goals
| Goal | Status |
|---|---|
| Explain-the-match tooltip |  Delivered via the per-match skill/GPA/work-auth breakdown shown with every score. |
| Recruiter-side view of matching students |  Delivered via the Applicant Pipeline, which lists every applicant's profile and score. |
| Sort listings by match score |  Delivered — the `/api/match` results are returned as a ranked list ordered by score, not just filtered. |
| Application tracking |  Implemented as a core feature rather than a stretch add-on. |

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (with Mongoose)
- **Authentication:** NextAuth.js (Google Provider)
- **Styling:** Tailwind CSS, shadcn/ui
- **AI:** Groq SDK (for resume parsing)
- **File Storage:** Cloudinary
- **Testing:** Vitest


## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/eren2yeager/credx-smartjobmatchingdash.git
cd credx-smartjobmatchingdash
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the project root and populate it with your credentials:
```env
# MongoDB Connection String
MONGODB_URI="your_mongodb_connection_string"

# NextAuth.js Configuration
NEXTAUTH_SECRET="generate_a_strong_secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Cloudinary (for resume storage)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Groq API (for AI resume parsing)
GROQ_API_KEY="your_groq_api_key"
```
### System Architecture
<img width="5924" height="3444" alt="image" src="https://github.com/user-attachments/assets/ed4b82e2-1273-4865-a2a2-5d2e9588e68d" />


<img width="1928" height="5624" alt="image" src="https://github.com/user-attachments/assets/a61d077b-8a71-4977-9dc8-df1ea48940c2" />

### 4. Seed the database (Optional)
To populate the database with sample job and internship listings for demonstration, run the seed script:
```bash
npm run seed
```

### 5. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## API Endpoints

The application exposes a RESTful API for handling data and business logic.

- **Authentication**: `/api/auth/[...nextauth]` - Handles user sign-in, sign-out, and session management via NextAuth.js.
- **Listings**: `/api/listings` - `GET` to list jobs/internships with filters (role, location, work mode, sponsorship), `POST` to create a new listing.
- **Profile**: `/api/profile` - `GET`, `POST`, `PATCH` to manage student profiles.
- **Resume Parsing**: `/api/resume-parse` - `POST` to upload a resume PDF for skill extraction and storage.
- **Matching**: `/api/match` - `GET` to retrieve calculated, ranked job/internship matches for the logged-in student.
- **Applications**: `/api/applications` - `GET`, `POST`, and `PATCH` to manage job applications for both students and recruiters.
