import { HydratedDocument, Schema, model } from "mongoose";

export const USER_ROLES = [
  "LRB",
  "LAA",
  "STATE",
  "CENTRAL",
  "PIA",
  "FIELD",
  "ADMIN",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserData {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  agency?: string;
  position?: string;
  state?: string;
  district?: string;
  avatarDataUrl?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
}

const userSchema = new Schema<UserData>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, select: false },
    googleId: { type: String, select: false, sparse: true, unique: true },
    role: { type: String, enum: USER_ROLES, required: true, default: "LRB" },
    agency: { type: String, trim: true, maxlength: 160 },
    position: { type: String, trim: true, maxlength: 160 },
    state: { type: String, trim: true, maxlength: 100 },
    district: { type: String, trim: true, maxlength: 100 },
    avatarDataUrl: { type: String, default: null, maxlength: 50_000 },
    isActive: { type: Boolean, default: true, required: true },
    isDeleted: { type: Boolean, default: false, required: true, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, result) {
        const {
          passwordHash: _passwordHash,
          googleId: _googleId,
          isDeleted: _isDeleted,
          __v: _version,
          ...safeResult
        } = result;
        return safeResult;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = HydratedDocument<UserData>;
export const User = model<UserData>("User", userSchema);
