import User from "../models/user.js";
import catchAsync from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import { promisify } from "util";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) check if email and password exist
  if (!email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide email and password!",
    });
  }
  //2) check if user exists && password is correct
  const user = await User.findOne({ email })
    .select("+password")
    .populate({
      path: "assignedTo",
      model: ["Department", "Market"],
    });

  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    return next(new AppError("Invalid username or password", 401));
  }
  //3) if everything ok, send token to client
  const token = signToken(user._id);
  const responseUser = {
    name: user.name,
    email: user.email,
    assignedTo: user.assignedTo,
  };
  res.status(200).json({
    status: "success",
    data: {
      user: responseUser,
      token,
    },
  });
});

const verifyUser = catchAsync(async (req, res, next) => {
  //1. Get token and check if it exists
  let token;
  if (req.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    next(new AppError("Authorized Users Only", 401));
  }

  //2.Verify token and handle 2 Errors
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  //3. Check if user exists
  const currentUser = await User.findById(decoded.id).populate({
    path: "assignedTo",
    model: ["Department", "Market"],
  });

  if (!currentUser) {
    return next(new AppError("User does not exist", 401));
  }
  //4. is Pasword Changed After the jwt issues
  const changed = currentUser.isPasswordChangedAfterTokenExpires(decoded.iat);
  if (changed) {
    return next(new AppError("User recently changed password", 401));
  }

  res.status(200).json({
    status: "success",
    user: currentUser,
  });
});

export { signToken, login, verifyUser };
