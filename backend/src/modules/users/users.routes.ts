import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "./user.model.js";

const usersRouter = Router();
const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  position: z.string().trim().max(160),
  state: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100),
  avatarDataUrl: z.union([
    z.string()
      .max(50_000)
      .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/, "Upload a valid profile image."),
    z.null(),
  ]),
}).strict();

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = await User.findById(request.user?.id);
    if (!user) throw new AppError(404, "NOT_FOUND", "User profile was not found.");
    response.json({ success: true, data: { user } });
  }),
);

usersRouter.patch(
  "/me",
  requireAuth,
  validateBody(profileSchema),
  asyncHandler(async (request, response) => {
    const user = await User.findByIdAndUpdate(
      request.user?.id,
      { $set: request.body },
      { new: true, runValidators: true },
    );
    if (!user) throw new AppError(404, "NOT_FOUND", "User profile was not found.");
    response.json({ success: true, data: { user } });
  }),
);

export { usersRouter };
