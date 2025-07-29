import User from "../models/user.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const createuser = catchAsync(async (req, res, next) => {
  const { name, email, password, role, departmentId, marketId } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new AppError("User already exists", 400));
  }

  if ((!departmentId && !marketId) || (departmentId && marketId)) {
    return res.status(400).json({
      error: "Provide either departmentId or marketId — not both.",
    });
  }

  // Prepare user data with optional departmentId or marketId
  const userData = {
    name,
    email,
    password,
    role,
  };

  if (departmentId) {
    userData.departmentId = departmentId;
    userData.marketId = undefined;
  }
  if (marketId) {
    userData.marketId = marketId;
    userData.departmentId = undefined;
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
  const users = await User.find().select("-password");

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
  const { name, email, role, departmentId, marketId, password } = req.body;

  if ((!departmentId && !marketId) || (departmentId && marketId)) {
    return res.status(400).json({
      error: "Provide either departmentId or marketId — not both.",
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, email, role, departmentId, marketId, password },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const deletedUser = await User.findById(userId);

  if (!deletedUser) {
    return next(new AppError("User not found", 404));
  }

  deletedUser.active = false; // Soft delete
  await deletedUser.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export { createuser, getAllUsers, deleteUser, updateUser };
