import express from "express";
const router = express.Router();
import { protectedRoute, restrictedTo } from "../middlewares/auth.js";
import {
  getWeeklyReport,
  updateSecurityReportById,
  setClearByIt,
  setClearByMonitoring,
  setClearByOperations,
} from "../controller/reportController.js";

router
  .route("/get-weekly-report")
  .get(protectedRoute, restrictedTo("superadmin", "admin"), getWeeklyReport);

router
  .route("/update-security-report/:reportId")
  .patch(protectedRoute, updateSecurityReportById);

router.route("/clear-by-it/:reportId").patch(protectedRoute, setClearByIt);
router
  .route("/clear-by-monitoring/:reportId")
  .patch(protectedRoute, setClearByMonitoring);
router
  .route("/clear-by-operations/:reportId")
  .patch(protectedRoute, setClearByOperations);

export default router;
