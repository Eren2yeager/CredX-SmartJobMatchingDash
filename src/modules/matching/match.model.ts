import { Schema, model, models, Types } from "mongoose";

export interface IMatch {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  listingId: Types.ObjectId;
  score: number;
  breakdown: {
    skillScore: number;
    gpaScore: number;
    workAuthCompatible: boolean;
    matchedSkills: string[];
  };
  computedAt: Date;
}

const MatchSchema = new Schema<IMatch>({
  studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
  listingId: { type: Schema.Types.ObjectId, ref: "Listing",        required: true },
  score:     { type: Number, min: 0, max: 100 },
  breakdown: {
    skillScore:         Number,
    gpaScore:           Number,
    workAuthCompatible: Boolean,
    matchedSkills:      [String],
  },
  computedAt: { type: Date, default: Date.now },
});

// ponytail: unique compound index enables findOneAndUpdate upsert keyed on (studentId, listingId)
MatchSchema.index({ studentId: 1, listingId: 1 }, { unique: true });

const Match = models.Match ?? model<IMatch>("Match", MatchSchema);
export default Match;
