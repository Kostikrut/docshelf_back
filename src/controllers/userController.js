import User from "../models/userModel.js";
import catchAsync from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";
import { uploadImage, getImageUrl } from "../utils//S3ImageUpload.js";

const filterObj = function (bodyObj, allowedFieldsArr) {
  const newBodyObj = {};

  Object.keys(bodyObj).forEach((el) => {
    if (allowedFieldsArr.includes(el)) newBodyObj[el] = bodyObj[el];
  });

  return newBodyObj;
};

export const updateMe = catchAsync(async (req, res, next) => {
  let image;

  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for password update, please use /updateMyPassword.",
        400
      )
    );

  if (req.file) {
    const imageName = await uploadImage(req.file);
    if (!imageName)
      return next(
        new AppError(
          "Failed to upload image, please ensure the file is valid.",
          500
        )
      );
    image = { filename: imageName };
  }

  // 3) Filter out unwanted fields
  const filteredBody = filterObj(req.body, [
    "fullName",
    "email",
    "phone",
    "address",
  ]);

  // Add image only if it exists
  if (image) filteredBody.image = image;

  filteredBody.image = image;

  // 3) Update user doc
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    user: updatedUser,
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.user.id);

  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "No user found with that Id",
    });
  }

  res.status(204).json({
    status: "success",
  });
});

export const createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  if (!newUser)
    next(new AppError("Couldn't create user, please try again later.", 500));

  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    },
  });
});

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

export const updateUser = catchAsync(async (req, res, next) => {
  const { fullName, email, phone, role } = req.body;
  const updateObj = { fullName, email, phone, role };
  let image, imageName;

  if (req.file) {
    imageName = await uploadImage(req.file.buffer);
    image = { filename: imageName };
    updateObj.image = image;
  }

  const user = await User.findByIdAndUpdate(req.params.id, updateObj, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("No document found with that Id", 404));
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that Id", 404));
  }

  // user.image.url = await getImageUrl(user.image.filename);
  // if (!user.image.url) {
  //   user.image.url = await getImageUrl("placeholder_profile_picture.jpeg");
  // }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
