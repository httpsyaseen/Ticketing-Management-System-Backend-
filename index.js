import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import UserRouter from "./routes/userRouter.js";
import marketRouter from "./routes/marketRouter.js";
import departmentRouter from "./routes/departmentRouter.js";
import ticketRouter from "./routes/ticketRouter.js";
import imageRouter from "./routes/imageRouter.js";
import reportRouter from "./routes/reportRouter.js";
import cors from "cors";

import { globalError } from "./controller/errorController.js";

import { createWeeklyReport } from "./controller/reportController.js";
import { seedMarketsAndUsers, starter } from "./controller/automation.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

starter();
// seedMarketsAndUsers();
createWeeklyReport();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/market", marketRouter);
app.use("/api/v1/department", departmentRouter);
app.use("/api/v1/ticket", ticketRouter);
app.use("/api/v1/report", reportRouter);
app.use("/tickets-assets", imageRouter);

app.use(globalError);

mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.log(err, "Server shut down"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
