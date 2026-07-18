import { Schema, model, models, Types } from "mongoose";

export interface IListing {
  _id: Types.ObjectId;
  recruiterId: Types.ObjectId | null;
  title: string;
  company: string;
  requiredSkills: string[];
  minGpa?: number;
  location?: string;
  workMode?: "remote" | "onsite" | "hybrid";
  sponsorshipOffered?: boolean;
  description?: string;
  createdAt: Date;
}

const ListingSchema = new Schema<IListing>({
  recruiterId:        { type: Schema.Types.ObjectId, ref: "User", default: null },
  title:              { type: String, minlength: 1, maxlength: 200 },
  company:            { type: String, minlength: 1, maxlength: 200 },
  requiredSkills:     [String],
  minGpa:             { type: Number, min: 0, max: 10 },
  location:           { type: String, maxlength: 200 },
  workMode:           { type: String, enum: ["remote", "onsite", "hybrid"] },
  sponsorshipOffered: Boolean,
  description:        { type: String, maxlength: 2000 },
  createdAt:          { type: Date, default: Date.now },
});

// ponytail: non-unique compound index — used only for seed idempotency lookup, not an enforcement constraint
ListingSchema.index({ title: 1, company: 1 });

const Listing = models.Listing ?? model<IListing>("Listing", ListingSchema);
export default Listing;
