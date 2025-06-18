import sharp from "sharp";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import crypto from "crypto";

const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SSERET_ACCESS_KEY;
const bucketName = process.env.AWS_BUCKET_NAME;
const bucketRegion = process.env.AWS_BUCKET_REGION;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const generateImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

async function uploadImage(file, type) {
  const imageName = generateImageName();
  let width, height;

  switch (type) {
    case "banner":
      width = 1500;
      height = 1000;
      break;
    case "profile":
      width = 500;
      height = 500;
      break;
    case "listing":
      width = 700;
      height = 700;
      break;
    default:
      width = 700;
      height = 700;
      break;
  }

  const processedImage = await sharp(file.buffer)
    .resize(width, height)
    .toBuffer();

  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: processedImage,
    ContentType: file.mimetype,
  };
  const command = new PutObjectCommand(params);

  const sendImage = await s3.send(command);

  if (!sendImage["$metadata"].httpStatusCode === 200) return null;

  return imageName;
}

async function deleteImage(imageName) {
  if (!imageName) return false;

  const deleteParams = {
    Bucket: bucketName,
    Key: imageName,
  };

  const command = new DeleteObjectCommand(deleteParams);
  try {
    await s3.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}

async function getImageUrl(imageName) {
  if (!imageName) return "";

  const getObjectParams = {
    Bucket: bucketName,
    Key: imageName,
  };

  const command = new GetObjectCommand(getObjectParams);

  const imageUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return imageUrl;
}

export { uploadImage, getImageUrl, deleteImage };
