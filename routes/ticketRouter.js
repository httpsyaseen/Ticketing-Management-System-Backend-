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

// Apply authentication to all routes
router.use(protectedRoute);

router.route("/create-ticket").post(upload.array("images", 2), createTicket);

router.route("/getusertickets").get(getUsertickets);

router.route("/get-ticket/:ticketId").get(getTicketById);

router.route("/:departmentId").get(getTicketByDepartment);

router.route("/get-tickets").post(getTicketsByDateAndType);

router.route("/close-ticket/:ticketId").patch(setClosedStatus);
router.route("/set-time/:ticketId").patch(setResolutionTime);
//ONLY ADMIN, SUPER ADMIN ROUTES

router.route("/add-comment/:ticketId").patch(addComment);

router.route("/set-resolved/:ticketId").patch(setResolvedStatus);
router.use(restrictedTo("admin", "superadmin"));

router.route("/refer-department/:ticketId").patch(referDepartment);

export default router;
