import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "./user.model.js";

const usersRouter = Router();

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = await User.findById(request.user?.id);
    response.json({ success: true, data: { user } });
  }),
);

export { usersRouter };
