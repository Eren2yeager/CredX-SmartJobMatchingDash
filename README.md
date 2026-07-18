# CredX: Smart Job Matching Dashboard

CredX is a skill-first career matching platform designed to connect students with relevant job opportunities and provide recruiters with a pipeline of qualified candidates. It moves beyond simple keyword matching by employing a weighted scoring engine that transparently evaluates compatibility based on skills, GPA, and work authorization.

## Key Features

### For Students
- **AI-Powered Resume Parsing:** Upload a PDF resume to have technical skills automatically extracted using the Groq API.
- **Intelligent Job Matching:** Receive a ranked list of job matches, each with a transparent score (0-100%) and a detailed breakdown of skill fit, GPA compatibility, and more.
- **Advanced Filtering:** Filter job matches by location, work mode (remote, hybrid, onsite), and visa sponsorship availability.
- **Comprehensive Application Tracking:** Manage all your job applications from a centralized dashboard.
- **Dynamic Profile Management:** Create and update a detailed profile with your skills, GPA, location, and work authorization status to continuously refine match results.

### For Recruiters
- **Structured Job Creation:** Post detailed job listings with specific requirements for skills, GPA, and location.
- **Applicant Pipeline:** View a list of candidates who have applied for each role, complete with their profile information and match score.
- **Application Management:** Update the status of each application (e.g., Under Review, Accepted, Rejected) directly from the pipeline view.
- **Recruiter Dashboard:** Get an at-a-glance overview of your active listings, total applicants, and applications currently under review.

## Matching Engine Explained
The core of CredX is its `scoreEngine`, which calculates a personalized match score for each student-job pairing. The final score is a weighted sum of three key factors:

- **Skill Overlap (60%):** Calculated using the Jaccard similarity index between the student's skills and the job's required skills.
- **GPA Fit (25%):** A score based on how the student's GPA compares to the minimum requirement, with a linear decay for GPAs below the threshold.
- **Work Authorization (15%):** A binary score indicating whether the student's visa requirements are compatible with the sponsorship offered by the role.

A hard cap is applied to the final score if work authorization is incompatible, ensuring that these critical mismatches are clearly flagged while keeping near-misses visible.

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

### 4. Seed the database (Optional)
To populate the database with sample job listings for demonstration, run the seed script:
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
- **Listings**: `/api/listings` - `GET` to list jobs with filters, `POST` to create a new job listing.
- **Profile**: `/api/profile` - `GET`, `POST`, `PATCH` to manage student profiles.
- **Resume Parsing**: `/api/resume-parse` - `POST` to upload a resume PDF for skill extraction and storage.
- **Matching**: `/api/match` - `GET` to retrieve calculated job matches for the logged-in student.
- **Applications**: `/api/applications` - `GET`, `POST`, and `PATCH` to manage job applications for both students and recruiters.
