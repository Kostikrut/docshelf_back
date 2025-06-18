import express from "express";

import { uploadImageToS3Bucket } from "../middlewares/s3ImageUpload.js";
import {
  signup,
  login,
  protect,
  verifyStoredToken,
  forgotPassword,
  resetPassword,
  updatePassword,
} from "../controllers/authController.js";

import {
  getMe,
  getUser,
  updateMe,
  updateUser,
  deleteMe,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

router.use(protect);

router.get("/verifyStoredToken", verifyStoredToken);
router.get("/me", getMe, getUser);
router.patch("/updateMe", uploadImageToS3Bucket, updateMe);
router.patch("/updateMyPassword", updatePassword);
router.delete("/deleteMe", deleteMe);

router.route("/:id").get(getUser).patch(uploadImageToS3Bucket, updateUser);

export default router;
