import { Router, type Request } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Compensation, LandParcel, RehabilitationCase } from "./workspace.models.js";

const workspaceRouter = Router();
const parcelStatuses = ["Identified", "Verified", "Under acquisition", "Possession"] as const;
const compensationStatuses = ["Assessment", "Approved", "Partially paid", "Paid"] as const;
const rehabilitationStatuses = ["Verification", "Eligible", "Support in progress", "Completed"] as const;
const recordText = (max: number) => z.string().trim().min(1).max(max);

const parcelSchema = z.object({
  reference: recordText(40),
  project: recordText(160),
  surveyNumber: recordText(80),
  ownerName: recordText(120),
  areaHectares: z.number().positive().max(1_000_000),
  status: z.enum(parcelStatuses).default("Identified"),
}).strict();

const compensationSchema = z.object({
  reference: recordText(40),
  project: recordText(160),
  parcelReference: recordText(80),
  recipient: recordText(120),
  awardAmount: z.number().nonnegative().max(1_000_000_000_000),
  paidAmount: z.number().nonnegative().max(1_000_000_000_000).default(0),
  status: z.enum(compensationStatuses).default("Assessment"),
}).strict();

const rehabilitationSchema = z.object({
  reference: recordText(40),
  project: recordText(160),
  familyName: recordText(120),
  affectedMembers: z.number().int().positive().max(1000),
  entitlement: recordText(160),
  status: z.enum(rehabilitationStatuses).default("Verification"),
}).strict();

const parcelStatusSchema = z.object({ status: z.enum(parcelStatuses) }).strict();
const compensationStatusSchema = z.object({ status: z.enum(compensationStatuses) }).strict();
const rehabilitationStatusSchema = z.object({ status: z.enum(rehabilitationStatuses) }).strict();

function locationScope(request: Request) {
  const user = request.user;
  if (!user) throw new AppError(401, "TOKEN_INVALID", "A valid access token is required.");
  if (user.role === "ADMIN" || user.role === "CENTRAL") return {};
  if (!user.state || !user.district) {
    throw new AppError(403, "SCOPE_REQUIRED", "Your account must have a state and district assigned.");
  }
  return { state: user.state, district: user.district };
}

function assertLocationAssigned(request: Request) {
  const user = request.user;
  if (!user || !user.state || !user.district) {
    throw new AppError(403, "SCOPE_REQUIRED", "Your account must have a state and district assigned before creating records.");
  }
  return { state: user.state, district: user.district };
}

workspaceRouter.use(requireAuth);

workspaceRouter.get("/land-parcels", asyncHandler(async (request, response) => {
  const records = await LandParcel.find(locationScope(request)).sort({ updatedAt: -1 }).limit(200);
  response.json({ success: true, data: { records } });
}));

workspaceRouter.post("/land-parcels", validateBody(parcelSchema), asyncHandler(async (request, response) => {
  const record = await LandParcel.create({ ...request.body, ...assertLocationAssigned(request) });
  response.status(201).json({ success: true, data: { record } });
}));

workspaceRouter.patch("/land-parcels/:id/status", validateBody(parcelStatusSchema), asyncHandler(async (request, response) => {
  const id = request.params.id;
  if (!id || Array.isArray(id) || !Types.ObjectId.isValid(id)) throw new AppError(400, "INVALID_ID", "Record ID is invalid.");
  const record = await LandParcel.findOneAndUpdate(
    { _id: id, ...locationScope(request) },
    { $set: { status: request.body.status } },
    { new: true, runValidators: true },
  );
  if (!record) throw new AppError(404, "NOT_FOUND", "Land parcel was not found in your workspace.");
  response.json({ success: true, data: { record } });
}));

workspaceRouter.get("/compensation", asyncHandler(async (request, response) => {
  const records = await Compensation.find(locationScope(request)).sort({ updatedAt: -1 }).limit(200);
  response.json({ success: true, data: { records } });
}));

workspaceRouter.post("/compensation", validateBody(compensationSchema), asyncHandler(async (request, response) => {
  const record = await Compensation.create({ ...request.body, ...assertLocationAssigned(request) });
  response.status(201).json({ success: true, data: { record } });
}));

workspaceRouter.patch("/compensation/:id/status", validateBody(compensationStatusSchema), asyncHandler(async (request, response) => {
  const id = request.params.id;
  if (!id || Array.isArray(id) || !Types.ObjectId.isValid(id)) throw new AppError(400, "INVALID_ID", "Record ID is invalid.");
  const record = await Compensation.findOneAndUpdate(
    { _id: id, ...locationScope(request) },
    { $set: { status: request.body.status } },
    { new: true, runValidators: true },
  );
  if (!record) throw new AppError(404, "NOT_FOUND", "Compensation record was not found in your workspace.");
  response.json({ success: true, data: { record } });
}));

workspaceRouter.get("/rehabilitation", asyncHandler(async (request, response) => {
  const records = await RehabilitationCase.find(locationScope(request)).sort({ updatedAt: -1 }).limit(200);
  response.json({ success: true, data: { records } });
}));

workspaceRouter.post("/rehabilitation", validateBody(rehabilitationSchema), asyncHandler(async (request, response) => {
  const record = await RehabilitationCase.create({ ...request.body, ...assertLocationAssigned(request) });
  response.status(201).json({ success: true, data: { record } });
}));

workspaceRouter.patch("/rehabilitation/:id/status", validateBody(rehabilitationStatusSchema), asyncHandler(async (request, response) => {
  const id = request.params.id;
  if (!id || Array.isArray(id) || !Types.ObjectId.isValid(id)) throw new AppError(400, "INVALID_ID", "Record ID is invalid.");
  const record = await RehabilitationCase.findOneAndUpdate(
    { _id: id, ...locationScope(request) },
    { $set: { status: request.body.status } },
    { new: true, runValidators: true },
  );
  if (!record) throw new AppError(404, "NOT_FOUND", "Rehabilitation case was not found in your workspace.");
  response.json({ success: true, data: { record } });
}));

export { workspaceRouter };
