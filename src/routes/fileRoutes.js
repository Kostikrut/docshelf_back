import express from "express";

import { protect, verifyStoredToken } from "../controllers/authController.js";
import { createFolder } from "../controllers/folderController.js";

const router = express.Router();

// router.post("/createfolder", protect, createFolder);

export default router;
