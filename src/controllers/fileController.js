import { GetObjectCommand } from "@aws-sdk/client-s3";
import File from "../models/FileModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { uploadFileToS3, deleteFileFromS3 } from "../utils/s3Helpers.js";
import { encryptFileBuffer, decryptFileBuffer } from "../utils/encryption.js";
import s3 from "../utils/S3Client.js";

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export const uploadFiles = catchAsync(async (req, res, next) => {
  const files = req.files;
  const userId = req.user._id;
  const fileKeyBase64 = req.headers["x-file-key"];
  const { parentFolder = null, tags = [], reminders = [] } = req.body;

  if (!files || files.length === 0) {
    return next(new AppError("No files provided", 400));
  }

  if (!fileKeyBase64) {
    return next(
      new AppError(
        "Missing file encryption key, please relogin and try again",
        400
      )
    );
  }

  const fileKey = Buffer.from(fileKeyBase64, "base64");

  if (fileKey.length !== 32) {
    return next(new AppError("Invalid file encryption key length", 400));
  }

  const savedFiles = await Promise.all(
    files.map(async (file) => {
      const encryptedBuffer = encryptFileBuffer(file.buffer, fileKey);

      const uploadRes = await uploadFileToS3(
        {
          ...file,
          buffer: encryptedBuffer,
        },
        userId,
        parentFolder
      );

      if (!uploadRes) throw new AppError("Upload to S3 failed", 500);

      const fileDoc = await File.create({
        filename: file.originalname,
        type: file.mimetype,
        size: file.size,
        url: uploadRes.key, // full path
        user: userId,
        parentFolder,
        isRoot: !parentFolder,
        tags,
        reminders,
      });

      return fileDoc;
    })
  );

  res.status(200).json({ status: "success", data: { files: savedFiles } });
});

export const downloadFile = catchAsync(async (req, res, next) => {
  const { id: fileId } = req.params;
  const userId = req.user._id;
  const fileKeyBase64 = req.headers["x-file-key"];

  if (!fileKeyBase64) {
    return next(
      new AppError(
        "Missing file encryption key, please relogin and try again",
        400
      )
    );
  }

  const fileKeyBuffer = Buffer.from(fileKeyBase64, "base64");

  if (fileKeyBuffer.length !== 32) {
    return next(new AppError("Invalid file encryption key length", 400));
  }

  const file = await File.findOne({ _id: fileId, user: userId });
  if (!file) return next(new AppError("File not found", 404));

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: file.url, // full S3 path
  });

  const s3Res = await s3.send(command);
  const encryptedBuffer = await streamToBuffer(s3Res.Body);
  const decryptedBuffer = decryptFileBuffer(encryptedBuffer, fileKeyBuffer);

  res.setHeader("Content-Type", file.type);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${file.filename}"`
  );
  res.send(decryptedBuffer);
});

export const deleteFile = catchAsync(async (req, res, next) => {
  const { id: fileId } = req.params;
  const userId = req.user._id;

  const file = await File.findOne({ _id: fileId, user: userId });
  if (!file) return next(new AppError("File not found", 404));

  const isDeleted = await deleteFileFromS3(file.url);
  if (!isDeleted) {
    return next(new AppError("File deletion failed", 500));
  }

  await File.deleteOne({ _id: fileId, user: userId });

  res
    .status(204)
    .json({ status: "success", message: "File deleted successfully" });
});

export const getFileDetails = catchAsync(async (req, res, next) => {
  const { id: fileId } = req.params;
  const userId = req.user._id;

  const file = await File.findOne({ _id: fileId, user: userId });

  if (!file) {
    return next(new AppError("File not found", 404));
  }

  res.status(200).json({ status: "success", data: { file } });
});
