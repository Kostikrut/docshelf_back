import express from "express";

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
router.patch("/updateMe", updateMe);
router.patch("/updateMyPassword", updatePassword);
router.delete("/deleteMe", deleteMe);

export default router;
