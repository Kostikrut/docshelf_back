import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({ path: ".env" });

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message, err);
  process.exit(1);
});

const DB = process.env.DATABASE;

mongoose
  .connect(DB)
  .then(() => console.log("Successfully connected to database"));

const port = process.env.PORT;

const server = app.listen(port, () =>
  console.log(`App is listening on port ${port}...`)
);

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message, err);
  server.close(() => {
    process.exit(1);
  });
});
