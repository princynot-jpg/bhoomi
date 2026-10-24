import { Schema, model, type Types } from "mongoose";

interface RefreshSessionData {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
}

const refreshSessionSchema = new Schema<RefreshSessionData>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const RefreshSession = model<RefreshSessionData>("RefreshSession", refreshSessionSchema);
