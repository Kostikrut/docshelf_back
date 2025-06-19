import { uploadFile, getFileUrl, deleteFile } from "../utils/s3Helpers.js";
import File from "../models/FileModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

export const uploadFiles = catchAsync(async (req, res, next) => {
  const files = req.files;
  const userId = req.user._id;
  const parentFolder = req.body.parentFolder;
  const tags = req.body.tags || [];
  const reminders = req.body.reminders || [];

  if (!files || files.length === 0) {
    return next(new AppError("No files provided", 400));
  }

  const savedFiles = await Promise.all(
    files.map(async (file) => {
      const res = await uploadFile(file, userId);

      if (!res) throw new AppError("Upload to S3 failed", 500);

      const fileDoc = await File.create({
        filename: file.originalname,
        type: file.mimetype,
        size: file.size,
        url: res.key,
        user: userId,

        parentFolder: parentFolder || null,
        isRoot: !parentFolder ? true : false,
        tags,
        reminders,
      });

      return fileDoc;
    })
  );

  res.status(200).json({ status: "success", data: { files: savedFiles } });
});

export const downloadFile = catchAsync(async (req, res, next) => {
  const { filename } = req.params;
  const userId = req.user._id;

  const key = `clients/${userId}/${filename}`;
  const url = await getFileUrl(key);

  res.status(200).json({ status: "success", data: { fileUrl: url } });
});

export const deleteFileController = catchAsync(async (req, res, next) => {
  const { filename } = req.params;
  const userId = req.user._id;

  const key = `clients/${userId}/${filename}`;
  const isDeleted = await deleteFile(key);

  if (!isDeleted) {
    return next(new AppError("File deletion failed", 500));
  }

  await File.deleteOne({ url: filename, user: userId });

  res
    .status(204)
    .json({ status: "success", message: "File deleted successfully" });
});
