import express from "express";

import { protect, verifyStoredToken } from "../controllers/authController.js";
import {
  createFolder,
  getFolder,
  getRootFolders,
} from "../controllers/folderController.js";

const router = express.Router();

router.post("/createfolder", protect, createFolder);
router.get("/root", protect, getRootFolders);

router.get("/:id", protect, getFolder);

export default router;
