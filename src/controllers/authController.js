import { promisify } from "util";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/userModel.js";
import catchAsync from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";
import { sendResetPasswordUrl } from "./../utils/email.js";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const expiresIn =
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000;

  const cookieOptions = {
    expires: new Date(expiresIn),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
    expiresIn,
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const { fullName, email, phone, password, passwordConfirm, address } =
    req.body;

  const user = await User.findOne({ email });

  if (user) {
    return res.status(400).json({
      status: "fail",
      message: "User with specified email already exists",
    });
  }

  const newUser = await User.create({
    fullName,
    email,
    phone,
    address,
    password,
    passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("Please provide an email and password", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or password ", 401));

  createSendToken(user, 200, res);
});

export const protect = catchAsync(async function (req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token)
    return next(
      new AppError("You are not logged in, please log in to get access.", 401)
    );

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const freshUser = await User.findById(decoded.id);
  if (!freshUser)
    return next(
      new AppError(
        "The user belonging to this token does no longer exist, pleasse log in again.",
        401
      )
    );

  if (freshUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError("User changed password recently, please log in again.", 401)
    );

  req.user = freshUser;

  next();
});

export const verifyStoredToken = catchAsync(async (req, res, next) => {
  if (req.user) return createSendToken(req.user, 200, res);

  return next(new AppError("No user found with this token.", 404));
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError("There is no user with that email address.", 404));

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.APP_URL}/resetPassword/${resetToken}`;

  try {
    await sendResetPasswordUrl({
      to: user.email,
      fullName: user.fullName,
      resetUrl,
    });

    return res.status(200).json({
      status: "success",
      message: `Reset token sent to the provided email (${user.email}). Your password reset token (valid for 10 minutes). `,
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was a problem sending the email, please try again later.",
        500
      )
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  if (!req.body.password || !req.body.passwordConfirm)
    return next(
      new AppError("Please provide a password and passwordConfirm.", 400)
    );
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) Set new password if token has not expired and user exists
  if (!user) return next(new AppError("Token is invalid or has expired.", 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send jwt
  createSendToken(user, 200, res);
});

export const updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const { currentPassword, password, passwordConfirm } = req.body;

  if (!(await user.correctPassword(currentPassword, user.password)))
    return next(
      new AppError("Your current password is wrong, Please try again.", 401)
    );

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
};
