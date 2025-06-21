import express from "express";

import { protect } from "../controllers/authController.js";
import {
  createReminder,
  getAllReminders,
  getReminder,
  updateReminder,
  deleteReminder,
  toggleReminderStatus,
  getUpcomingReminders,
  getPastReminders,
} from "../controllers/reminderController.js";

const router = express.Router();
router.use(protect);

router.post("/", createReminder);
router.get("/all", getAllReminders);
router.get("/upcoming", getUpcomingReminders);
router.get("/past", getPastReminders);

router
  .route("/:id")
  .get(getReminder)
  .patch(updateReminder)
  .delete(deleteReminder)
  .put(toggleReminderStatus);

export default router;
