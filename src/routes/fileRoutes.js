import express from "express";
import multer from "multer";

import { protect } from "../controllers/authController.js";
import {
  uploadFiles,
  downloadFile,
  deleteFile,
  getFileDetails,
} from "../controllers/fileController.js";
import { getFileTree } from "../controllers/treeController.js";

const router = express.Router();
const upload = multer();

router.use(protect);

router.post("/", upload.array("files", 5), uploadFiles);
router.get("/tree", getFileTree);
router.get("/details/:id", getFileDetails);
router.get("/:id", downloadFile);
router.delete("/:id", deleteFile);

export default router;
