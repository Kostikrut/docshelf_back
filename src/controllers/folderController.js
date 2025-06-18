import catchAsync from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";

import Folder from "./../models/folderModel.js";
import File from "./../models/fileModel.js";
import User from "./../models/userModel.js";

export const createFolder = catchAsync(async (req, res, next) => {
  const {
    name,
    parentFolder,
    permission = "private",
    permitedUsers = [],
    tags = [],
  } = req.body;
  let isRoot = false;

  if (!name) {
    return next(new AppError("Folder name is required", 400));
  }

  if (!parentFolder) {
    isRoot = true;
  }

  const folder = await Folder.create({
    name,
    user: req.user._id,
    parentFolder,
    permission,
    permitedUsers,
    tags,
    isRoot,
  });

  res.status(201).json({
    status: "success",
    data: {
      folder,
    },
  });
});

export const getFolder = catchAsync(async (req, res, next) => {
  const { id: folderId } = req.params;

  if (!folderId) return next(new AppError("Folder Id is required", 400));

  const folder = await Folder.findById(folderId).populate(
    "permitedUsers",
    "parentFolder"
  );

  if (!folder) return next(new AppError("Folder not found", 404));

  res.status(200).json({
    status: "success",
    data: {
      folder,
    },
  });
});
