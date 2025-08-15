import express from "express";
const router = express.Router();
import { protectedRoute, restrictedTo } from "../middlewares/auth.js";
import {
  getWeeklyReport,
  updateSecurityReportById,
} from "../controller/reportController.js";

router
  .route("/get-weekly-report")
  .get(protectedRoute, restrictedTo("superadmin"), getWeeklyReport);

router
  .route("/update-security-report/:reportId")
  .patch(protectedRoute, updateSecurityReportById);

export default router;
