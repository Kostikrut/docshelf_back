import express from "express";

import { protect } from "../controllers/authController.js";
import {
  createFolder,
  getFolder,
  getRootFolders,
  updateFolder,
  moveFolder,
  trashFolder,
  deleteFolder,
} from "../controllers/folderController.js";

const router = express.Router();

router.use(protect);

router.post("/createfolder", createFolder);
router.get("/root", getRootFolders);
router.patch("/moveFolder/:id", moveFolder);
router.patch("/trash/:id", trashFolder);

router.get("/:id", getFolder);
router.patch("/:id", updateFolder);
router.delete("/:id", deleteFolder);

export default router;
