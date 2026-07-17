import mongoose, { Schema, model, models, Types } from "mongoose";

export interface IApplication {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  listingId: Types.ObjectId;
  status: "applied" | "under_review" | "accepted" | "rejected";
  appliedAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  studentId: { type: Schema.Types.ObjectId, ref: "User",    required: true },
  listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  status:    { type: String, enum: ["applied", "under_review", "accepted", "rejected"], default: "applied" },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ponytail: unique compound index enforces no duplicate applications; DB-level 409 source
ApplicationSchema.index({ studentId: 1, listingId: 1 }, { unique: true });

const Application = models.Application ?? model<IApplication>("Application", ApplicationSchema);
export default Application;
