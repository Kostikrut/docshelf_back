import catchAsync from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";

import Folder from "./../models/folderModel.js";
import File from "./../models/fileModel.js";

export async function isFolderExists(folderId, userId, next) {
  if (!folderId) return next(new AppError("Folder Id is required", 400));

  const folder = await Folder.findById(folderId);

  if (!folder) return next(new AppError("Folder not found", 404));

  if (folder.user.toString() !== userId.toString()) {
    return next(
      new AppError(
        "You do not have permission to perform actions on this folder",
        403
      )
    );
  }

  return folder;
}

async function deleteFolderRecursively(folderId, userId) {
  await File.deleteMany({ parentFolder: folderId, user: userId });

  const subfolders = await Folder.find({
    parentFolder: folderId,
    user: userId,
  });

  for (const subfolder of subfolders) {
    await deleteFolderRecursively(subfolder._id, userId);
  }

  await Folder.findByIdAndDelete(folderId);
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
    (await Folder.find({
      user: req.user._id,
      isRoot: true,
      isTrashed: false,
    })) || [];

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

  const folder = await isFolderExists(folderId, req.user._id, next);

  if (folder.isTrashed)
    return next(new AppError("Cannot update trashed folder", 400));

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

  const folder = await isFolderExists(folderId, req.user._id, next);

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

export const trashFolder = catchAsync(async (req, res, next) => {
  const { id: folderId } = req.params;

  const folder = await isFolderExists(folderId, req.user._id, next);

  folder.isTrashed = true;
  await folder.save();

  res.status(200).json({
    status: "success",
    data: {
      folder,
    },
  });
});

export const deleteFolder = catchAsync(async (req, res, next) => {
  const { id: folderId } = req.params;

  const folder = await isFolderExists(folderId, req.user._id, next);

  if (!folder.isTrashed) {
    return next(new AppError("Folder must be trashed before deletion", 400));
  }

  await deleteFolderRecursively(folderId, req.user._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
