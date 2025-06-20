import express from "express";
import {
  uploadFiles,
  downloadFile,
  deleteFileController,
  getFileDetails,
} from "../controllers/fileController.js";
import { protect } from "../controllers/authController.js";
// import apiKeyAuth from "../middlewares/apiKeyAuth.js";
import multer from "multer";

const router = express.Router();
const upload = multer();

router.use(protect);

router.get("/details/:id", getFileDetails);
router.post("/", upload.array("files", 5), uploadFiles);
router.get("/:filename", downloadFile);
router.delete("/:filename", deleteFileController);

export default router;
