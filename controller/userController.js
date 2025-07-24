import User from "../models/user.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const createuser = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.find({ email });
  console.log(existingUser, "existing user");
  if (existingUser.length > 0) {
    return next(new AppError("User already exists", 400));
  }
  // Create new user
  const newUser = await User.create({
    name,
    email,
    password,
    role,
    departmentId: req.body.departmentId || null,
    marketId: req.body.marketId || null,
  });

  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select("-password");

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

export { createuser, getAllUsers };
