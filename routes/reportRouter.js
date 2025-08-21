import express from "express";
import {
  getWeeklyReport,
  updateSecurityReportById,
  setClearByIt,
  setClearByMonitoring,
  setClearByOperations,
  getWeeklyReportByDate,
  getWeeklyReportById,
} from "../controller/reportController.js";
import { protectedRoute, restrictedTo } from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protectedRoute);

// Weekly report retrieval (admin/superadmin only)
router.get(
  "/get-weekly-report",
  restrictedTo("superadmin", "admin"),
  getWeeklyReport
);

// Update a specific security report
router.patch("/update-security-report/:reportId", updateSecurityReportById);

// Mark weekly report as cleared by IT
router.patch("/clear-by-it/:reportId", setClearByIt);

// Mark weekly report as cleared by Monitoring
router.patch("/clear-by-monitoring/:reportId", setClearByMonitoring);

// Mark weekly report as cleared by Operations
router.patch("/clear-by-operations/:reportId", setClearByOperations);

// Get weekly reports by date range (admin/superadmin only)
router.post(
  "/get-report-by-date",
  restrictedTo("superadmin", "admin"),
  getWeeklyReportByDate
);

router.route("/:reportId").get(getWeeklyReportById);

export default router;
