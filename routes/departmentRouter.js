import express from "express";
const router = express.Router();
import { protectedRoute, restrictedTo } from "../middlewares/auth.js";
import {
  createDepartment,
  getAllDepartments,
} from "../controller/departmentController.js";

router
  .route("/create-department")
  .post(protectedRoute, restrictedTo("superadmin", "admin"), createDepartment);
router
  .route("/get-all-departments")
  .get(
    protectedRoute,
    restrictedTo("superadmin", "admin", "user"),
    getAllDepartments
  );

export default router;
