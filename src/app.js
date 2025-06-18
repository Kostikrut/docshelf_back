import express from "express";
import morgan from "morgan";

import userRouter from "./routes/userRoutes.js";
import folderRouter from "./routes/folderRoutes.js";
import fileRouter from "./routes/fileRoutes.js";
import AppError from "./utils/appError.js";

import cors from "cors";

const app = express();

app.use(cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());

app.use("/api/v1/check", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the API",
  });
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/folders", folderRouter);
app.use("/api/v1/files", fileRouter);

app.all("/", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

export default app;
