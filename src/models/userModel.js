import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Please provide your full name"],
    validate: {
      validator: function (v) {
        return /^[a-zA-Z\s]+$/.test(v); // Ensure no numbers in full name
      },
      message: "Full name should not contain numbers.",
    },
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide your email address"],
    trim: true,
    lowerCase: true,
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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // sometimes token created a bit before the passwordChangedAt actually being created, so i subtract 1 sec.

  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const formatedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < formatedTimeStamp;
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

const User = mongoose.model("User", userSchema);

export default User;
