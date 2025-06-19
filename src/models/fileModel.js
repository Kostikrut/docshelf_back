import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, "Please provide a folder name"],
    trim: true,
  },
  type: {
    type: String,
  },
  url: {
    type: String,
    default: null,
  },
  previewImage: {
    type: String,
    default: null,
  },
  size: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Folder must belong to a user"],
  },
  permission: {
    type: String,
    enum: ["private", "public", "shared"],
    default: "private",
  },
  permitedUsers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  remiders: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Reminder",
    default: [],
  },
  tags: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  isRoot: {
    type: Boolean,
    default: false,
  },
  isTrashed: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const File = mongoose.models.File || mongoose.model("File", folderSchema);

export default File;
