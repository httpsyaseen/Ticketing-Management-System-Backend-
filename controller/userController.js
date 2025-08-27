import User from "../models/user.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Department from "../models/department.js";

const createuser = catchAsync(async (req, res, next) => {
  const { name, email, password, role, assignedTo, assignedToType } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new AppError("User already exists", 400));
  }

  // Prepare user data with optional departmentId or marketId
  const userData = {
    name,
    email,
    password,
    assignedTo,
    assignedToType,
  };

  if (assignedToType === "Department") {
    userData.role = "admin";
  } else if (assignedToType === "Market") {
    userData.role = "user";
  }

  // Create new user
  const newUser = await User.create(userData);

  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()
    .select("-password")
    .populate({
      path: "assignedTo",
      model: ["Department", "Market"],
    });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { name, password } = req.body;

  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found", 404));

  if (name !== undefined) user.name = name;
  if (password !== undefined) user.password = password;

  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({
    status: "success",
    data: { user: userObj },
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const deletedUser = await User.findById(userId);

  if (!deletedUser) {
    return next(new AppError("User not found", 404));
  }

  deletedUser.active = false; // Soft delete
  deletedUser.email = `${deletedUser.email.split("@")[0]}@deleted.com`;
  await deletedUser.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export { createuser, getAllUsers, deleteUser, updateUser };
