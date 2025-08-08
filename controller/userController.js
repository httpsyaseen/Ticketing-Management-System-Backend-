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
    role,
    assignedTo,
    assignedToType,
  };

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

  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found", 404));

  // Apply updates manually
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (password !== undefined) user.password = password;

  if (departmentId && marketId) {
    return res.status(400).json({
      error: "Provide either departmentId or marketId — not both.",
    });
  }

  if (departmentId !== undefined) {
    user.departmentId = departmentId;
    user.marketId = undefined;
  }
  if (marketId !== undefined) {
    user.marketId = marketId;
    user.departmentId = undefined;
  }

  await user.save(); // <-- pre-save hooks now run

  res.status(200).json({
    status: "success",
    data: {
      user,
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

const starter = catchAsync(async () => {
  const user = await User.findOne({ email: "superadmin@gmail.com" });
  let department = await Department.findOne({
    name: "Head Office Administration",
  });

  if (!department) {
    department = await Department.create({
      name: "Head Office Administration",
    });
  }
  if (!user) {
    const newUser = await User.create({
      name: "Super Admin",
      email: "superadmin@gmail.com",
      password: "superadmin123",
      role: "superadmin",
      assignedTo: department._id,
      assignedToType: "Department",
    });
  }
  return;
});

export { createuser, getAllUsers, deleteUser, updateUser, starter };
