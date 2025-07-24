import express from "express";
import mongoose from "mongoose";
import UserRouter from "./routes/userRouter.js";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/api/v1/users", UserRouter);

mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.log(err, "Server shut down"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
