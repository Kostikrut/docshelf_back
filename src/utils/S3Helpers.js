import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import s3 from "./S3Client.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const bucketName = process.env.AWS_BUCKET_NAME;

export function generateFileName(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export async function uploadFile(file, userId) {
  const fileName = generateFileName();
  const key = `clients/${userId}/${fileName}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return { key };
}

export async function getFileUrl(key) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return url;
}

export async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const res = await s3.send(command);

  return res.$metadata.httpStatusCode === 204;
}
