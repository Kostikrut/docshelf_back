import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a folder name"],
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Folder must belong to a user"],
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
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

const Folder = mongoose.model("Folder", folderSchema);

export default Folder;
