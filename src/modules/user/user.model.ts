import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  googleId: string;
  email: string;
  name?: string;
  image?: string;
  isRecruiter: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  googleId:    { type: String, required: true, unique: true },
  email:       { type: String, required: true, unique: true },
  name:        String,
  image:       String,
  isRecruiter: { type: Boolean, default: false },
  createdAt:   { type: Date,   default: Date.now },
});

// ponytail: `models.User ||` prevents recompile errors in Next.js hot-reload
const User = models.User ?? model<IUser>("User", UserSchema);
export default User;
