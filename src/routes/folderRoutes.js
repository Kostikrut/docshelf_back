import express from "express";

import { protect, verifyStoredToken } from "../controllers/authController.js";
import {
  createFolder,
  getFolder,
  getRootFolders,
  updateFolder,
  moveFolder,
} from "../controllers/folderController.js";

const router = express.Router();

router.use(protect);

router.post("/createfolder", createFolder);
router.get("/root", getRootFolders);
router.patch("/moveFolder/:id", moveFolder);

router.get("/:id", getFolder);
router.patch("/:id", updateFolder);

export default router;
