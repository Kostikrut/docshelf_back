import Folder from "../models/folderModel.js";
import File from "../models/fileModel.js";
import catchAsync from "../utils/catchAsync.js";
import { buildFileTree } from "../utils/fileTree.js";

export const getFileTree = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const folders = await Folder.find({ user: userId }).select(
    "_id name parentFolder createdAt"
  );
  const files = await File.find({ user: userId }).select(
    "_id filename parentFolder size createdAt remiders"
  );

  const tree = buildFileTree(folders, files);

  res.status(200).json({ status: "success", data: { tree } });
});
