import Reminder from "../models/reminderModel.js";
import catchAsync from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";

export const createReminder = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    date,
    time,
    isRecurring,
    recurrencePattern,
    recurrenceEndDate,
  } = req.body;

  if (!title) {
    return next(new AppError("Title is required for creating a reminder", 400));
  }

  if (isRecurring && !recurrencePattern) {
    return next(
      new AppError(
        "Recurrence pattern is required for recurring reminders",
        400
      )
    );
  }

  const reminder = await Reminder.create({
    title,
    description,
    date,
    time,
    isRecurring,
    recurrencePattern,
    recurrenceEndDate,
    user: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      reminder,
    },
  });
});

export const getAllReminders = catchAsync(async (req, res, next) => {
  const reminders = await Reminder.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: "success",
    results: reminders.length,
    data: {
      reminders,
    },
  });
});

export const getReminder = catchAsync(async (req, res, next) => {
  const reminder = await Reminder.findById(req.params.id);

  if (!reminder) {
    return next(new AppError("No reminder found with that Id", 404));
  }

  if (reminder.user.toString() !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission to access this reminder", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      reminder,
    },
  });
});

export const updateReminder = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    date,
    time,
    isRecurring,
    recurrencePattern,
    recurrenceEndDate,
  } = req.body;

  const reminder = await Reminder.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      date,
      time,
      isRecurring,
      recurrencePattern,
      recurrenceEndDate,
    },
    { new: true, runValidators: true }
  );

  if (!reminder) {
    return next(new AppError("No reminder found with that Id", 404));
  }

  if (reminder.user.toString() !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission to update this reminder", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      reminder,
    },
  });
});

export const deleteReminder = catchAsync(async (req, res, next) => {
  const reminder = await Reminder.findByIdAndDelete(req.params.id);

  if (!reminder) {
    return next(new AppError("No reminder found with that Id", 404));
  }

  if (reminder.user.toString() !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission to delete this reminder", 403)
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const toggleReminderStatus = catchAsync(async (req, res, next) => {
  const reminder = await Reminder.findById(req.params.id);

  if (!reminder) {
    return next(new AppError("No reminder found with that Id", 404));
  }

  if (reminder.user.toString() !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission to toggle this reminder", 403)
    );
  }

  reminder.isActive = !reminder.isActive;
  await reminder.save();

  res.status(200).json({
    status: "success",
    data: {
      reminder,
    },
  });
});

export const getUpcomingReminders = catchAsync(async (req, res, next) => {
  const now = new Date();
  const reminders = await Reminder.find({
    user: req.user._id,
    date: { $gte: now },
    isActive: true,
  }).sort({ date: 1 });

  res.status(200).json({
    status: "success",
    results: reminders.length,
    data: {
      reminders,
    },
  });
});

export const getPastReminders = catchAsync(async (req, res, next) => {
  const now = new Date();
  const reminders = await Reminder.find({
    user: req.user._id,
    date: { $lt: now },
  }).sort({ date: -1 });

  res.status(200).json({
    status: "success",
    results: reminders.length,
    data: {
      reminders,
    },
  });
});
