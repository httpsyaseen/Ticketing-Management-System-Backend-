import Department from "../models/department.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const createDepartment = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  // Check if department already exists
  const existingDepartment = await Department.findOne({ name });
  if (existingDepartment) {
    return next(new AppError("Department already exists", 400));
  }
  // Create new department
  const newDepartment = await Department.create({ name });
  res.status(201).json({
    status: "success",
    data: {
      department: newDepartment,
    },
  });
});

const getAllDepartments = catchAsync(async (req, res, next) => {
  const departments = await Department.find();

  res.status(200).json({
    status: "success",
    results: departments.length,
    data: {
      departments,
    },
  });
});

export { createDepartment, getAllDepartments };
