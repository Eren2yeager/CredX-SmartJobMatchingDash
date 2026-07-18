import { Schema, model, models, Types } from "mongoose";

export interface IStudentProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  skills: string[];
  gpa?: number;
  workAuthStatus?: "citizen" | "permanent_resident" | "visa_sponsorship_required" | "other";
  location?: string;
  resumeUrl?: string;
  resumeParsedSkills: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>({
  userId:             { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  skills:             [String],
  gpa:                { type: Number, min: 0, max: 10 },
  workAuthStatus:     { type: String, enum: ["citizen", "permanent_resident", "visa_sponsorship_required", "other"] },
  location:           String,
  resumeUrl:          String,
  resumeParsedSkills: [String],
  createdAt:          { type: Date, default: Date.now },
  updatedAt:          { type: Date, default: Date.now },
});

// ponytail: `models.StudentProfile ||` prevents recompile errors in Next.js hot-reload
const StudentProfile = models.StudentProfile ?? model<IStudentProfile>("StudentProfile", StudentProfileSchema);
export default StudentProfile;
