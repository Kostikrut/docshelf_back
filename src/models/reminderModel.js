import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Reminder must have a title"],
  },
  description: {
    type: String,
    default: null,
  },
  date: {
    type: [Date],
    default: [],
  },
  time: {
    type: Date,
    default: null,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrencePattern: {
    type: String,
    enum: ["daily", "weekly", "monthly", "yearly", "once"],
    default: "once",
  },
  recurrenceEndDate: {
    type: Date,
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Reminder must belong to a user"],
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
