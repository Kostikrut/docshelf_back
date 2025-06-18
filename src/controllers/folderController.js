import catchAsync from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";

import Folder from "./../models/folderModel.js";
import File from "./../models/fileModel.js";
import User from "./../models/userModel.js";

async function isFolderExists(folderId, next) {
  if (!folderId) return next(new AppError("Folder Id is required", 400));

  const folder = await Folder.findById(folderId);

  if (!folder) return next(new AppError("Folder not found", 404));

  return folder;
}

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

  const files =
    (await File.find({ user: req.user._id, parentFolder: folderId })) || [];

  const folders =
    (await File.find({ user: req.user._id, parentFolder: folderId })) || [];

  res.status(200).json({
    status: "success",
    data: {
      folder,
      content: {
        files,
        folders,
      },
    },
  });
});

export const getRootFolders = catchAsync(async (req, res, next) => {
  const folders =
    (await Folder.find({ user: req.user._id, isRoot: true })) || [];

  res.status(200).json({
    status: "success",
    data: {
      folders,
    },
  });
});

export const updateFolder = catchAsync(async (req, res, next) => {
  const { id: folderId } = req.params;
  const { name, permission, permitedUsers, tags } = req.body;

  const folder = await isFolderExists(folderId, next);

  folder.name = name || folder.name;
  folder.permission = permission || folder.permission;
  folder.permitedUsers = permitedUsers || folder.permitedUsers;
  folder.tags = tags || folder.tags;

  await folder.save();

  res.status(200).json({
    status: "success",
    data: {
      folder,
    },
  });
});

export const moveFolder = catchAsync(async (req, res, next) => {
  const { id: folderId } = req.params;
  const { parentFolder, isRoot = false } = req.body;

  const folder = await isFolderExists(folderId, next);

  if (isRoot) {
    folder.parentFolder = null;
    folder.isRoot = true;

    return res.status(200).json({
      status: "success",
      data: {
        folder,
      },
    });
  }

  const newParentFolder = await isFolderExists(parentFolder, next);

  folder.parentFolder = newParentFolder._id;
  folder.isRoot = false;

  const newFolder = await folder.save();

  res.status(200).json({
    status: "success",
    data: {
      folder: newFolder,
    },
  });
});
