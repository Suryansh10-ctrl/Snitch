import { Router } from "express";
import { getAllFeedbacks, createFeedback, updateFeedback, deleteFeedback } from "../controller/feedback.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const feedbackRouter = Router();

feedbackRouter.get("/", getAllFeedbacks);
feedbackRouter.post("/", authenticateUser, createFeedback);
feedbackRouter.put("/:id", authenticateUser, updateFeedback);
feedbackRouter.delete("/:id", authenticateUser, deleteFeedback);

export default feedbackRouter;
