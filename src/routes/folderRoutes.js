import express from "express";

import { protect, verifyStoredToken } from "../controllers/authController.js";
import { createFolder, getFolder } from "../controllers/folderController.js";

const router = express.Router();

router.post("/createfolder", protect, createFolder);
router.get("/:id", protect, getFolder);

export default router;
