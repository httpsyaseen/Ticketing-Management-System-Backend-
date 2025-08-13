import express from "express";
import {
  createTicket,
  getTicketByDepartment,
  setResolutionTime,
  addComment,
  setClosedStatus,
  setResolvedStatus,
  referDepartment,
  getUsertickets,
  getTicketById,
  getTicketsByDateAndType,
} from "../controller/ticketController.js";
import { protectedRoute, restrictedTo } from "../middlewares/auth.js";
import upload from "../config/multerConfig.js";

const router = express.Router();

router
  .route("/create-ticket")
  .post(protectedRoute, upload.array("images", 2), createTicket);

router.route("/getusertickets").get(protectedRoute, getUsertickets);

router.route("/get-ticket/:ticketId").get(protectedRoute, getTicketById);

router.route("/:departmentId").get(protectedRoute, getTicketByDepartment);
router
  .route("/set-time/:ticketId")
  .patch(protectedRoute, restrictedTo("admin"), setResolutionTime);

router
  .route("/add-comment/:ticketId")
  .patch(protectedRoute, restrictedTo("admin"), addComment);

router
  .route("/set-resolved/:ticketId")
  .patch(protectedRoute, restrictedTo("admin"), setResolvedStatus);
router.route("/close-ticket/:ticketId").patch(protectedRoute, setClosedStatus);

router
  .route("/refer-department/:ticketId")
  .patch(protectedRoute, restrictedTo("admin"), referDepartment);

router.route("/get-tickets").post(protectedRoute, getTicketsByDateAndType);

export default router;
