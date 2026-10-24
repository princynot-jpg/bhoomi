import { Schema, model } from "mongoose";

interface LocationFields {
  state: string;
  district: string;
}

export interface LandParcelData extends LocationFields {
  reference: string;
  project: string;
  surveyNumber: string;
  ownerName: string;
  areaHectares: number;
  status: "Identified" | "Verified" | "Under acquisition" | "Possession";
}

export interface CompensationData extends LocationFields {
  reference: string;
  project: string;
  parcelReference: string;
  recipient: string;
  awardAmount: number;
  paidAmount: number;
  status: "Assessment" | "Approved" | "Partially paid" | "Paid";
}

export interface RehabilitationData extends LocationFields {
  reference: string;
  project: string;
  familyName: string;
  affectedMembers: number;
  entitlement: string;
  status: "Verification" | "Eligible" | "Support in progress" | "Completed";
}

const locationFields = {
  state: { type: String, required: true, trim: true, maxlength: 100, index: true },
  district: { type: String, required: true, trim: true, maxlength: 100, index: true },
};

const landParcelSchema = new Schema<LandParcelData>(
  {
    ...locationFields,
    reference: { type: String, required: true, trim: true, maxlength: 40 },
    project: { type: String, required: true, trim: true, maxlength: 160 },
    surveyNumber: { type: String, required: true, trim: true, maxlength: 80 },
    ownerName: { type: String, required: true, trim: true, maxlength: 120 },
    areaHectares: { type: Number, required: true, min: 0.01, max: 1_000_000 },
    status: {
      type: String,
      enum: ["Identified", "Verified", "Under acquisition", "Possession"],
      default: "Identified",
      required: true,
    },
  },
  { timestamps: true },
);
landParcelSchema.index({ state: 1, district: 1, reference: 1 }, { unique: true });

const compensationSchema = new Schema<CompensationData>(
  {
    ...locationFields,
    reference: { type: String, required: true, trim: true, maxlength: 40 },
    project: { type: String, required: true, trim: true, maxlength: 160 },
    parcelReference: { type: String, required: true, trim: true, maxlength: 80 },
    recipient: { type: String, required: true, trim: true, maxlength: 120 },
    awardAmount: { type: Number, required: true, min: 0, max: 1_000_000_000_000 },
    paidAmount: { type: Number, required: true, min: 0, max: 1_000_000_000_000, default: 0 },
    status: {
      type: String,
      enum: ["Assessment", "Approved", "Partially paid", "Paid"],
      default: "Assessment",
      required: true,
    },
  },
  { timestamps: true },
);
compensationSchema.index({ state: 1, district: 1, reference: 1 }, { unique: true });

const rehabilitationSchema = new Schema<RehabilitationData>(
  {
    ...locationFields,
    reference: { type: String, required: true, trim: true, maxlength: 40 },
    project: { type: String, required: true, trim: true, maxlength: 160 },
    familyName: { type: String, required: true, trim: true, maxlength: 120 },
    affectedMembers: { type: Number, required: true, min: 1, max: 1000 },
    entitlement: { type: String, required: true, trim: true, maxlength: 160 },
    status: {
      type: String,
      enum: ["Verification", "Eligible", "Support in progress", "Completed"],
      default: "Verification",
      required: true,
    },
  },
  { timestamps: true },
);
rehabilitationSchema.index({ state: 1, district: 1, reference: 1 }, { unique: true });

export const LandParcel = model<LandParcelData>("LandParcel", landParcelSchema);
export const Compensation = model<CompensationData>("Compensation", compensationSchema);
export const RehabilitationCase = model<RehabilitationData>("RehabilitationCase", rehabilitationSchema);
