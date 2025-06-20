import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { wrapFileKey, unwrapFileKey } from "../utils/encryption.js";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Please provide your full name"],
    validate: {
      validator: (v) => /^[a-zA-Z\s]+$/.test(v),
      message: "Full name should not contain numbers.",
    },
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide your email address"],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address"],
  },
  phone: {
    type: Number,
    unique: true,
    required: [true, "Please tell us your phone number"],
  },
  image: {
    filename: String,
    url: String,
  },
  fileEncryptionKeyWrapped: {
    type: String,
    select: false,
  },
  fileEncryptionKeySalt: {
    type: String,
    select: false,
  },
  fileEncryptionKeyIV: {
    type: String,
    select: false,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    select: false,
    minLength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// hash password + generate encryption key
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (!this.fileEncryptionKeyWrapped) {
    const fileKey = crypto.randomBytes(32);
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    const wrapped = wrapFileKey(fileKey, this.get("password"), salt, iv);

    this.fileEncryptionKeyWrapped = wrapped.toString("base64");
    this.fileEncryptionKeySalt = salt.toString("base64");
    this.fileEncryptionKeyIV = iv.toString("base64");
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const formattedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < formattedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// rewrap file encryption key on password change
userSchema.methods.rewrapFileEncryptionKey = function (
  oldPassword,
  newPassword
) {
  const fileKey = unwrapFileKey(
    this.fileEncryptionKeyWrapped,
    oldPassword,
    this.fileEncryptionKeySalt,
    this.fileEncryptionKeyIV
  );

  const newSalt = crypto.randomBytes(16);
  const newIv = crypto.randomBytes(12);
  const newWrapped = wrapFileKey(fileKey, newPassword, newSalt, newIv);

  this.fileEncryptionKeySalt = newSalt.toString("base64");
  this.fileEncryptionKeyIV = newIv.toString("base64");
  this.fileEncryptionKeyWrapped = newWrapped.toString("base64");
};

const User = mongoose.model("User", userSchema);
export default User;
