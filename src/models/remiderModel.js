import mongoose from "mongoose";

const remiderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Reminder must have a title"],
  },
  description: {
    type: String,
    default: null,
  },
  date: {
    type: Date,
    required: [true, "Reminder must have a date"],
  },
  time: {
    type: String,
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Reminder must belong to a user"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reminder = mongoose.model("Reminder", remiderSchema);

export default Reminder;
