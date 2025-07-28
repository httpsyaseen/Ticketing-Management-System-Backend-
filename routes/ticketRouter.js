import express from "express";
import {
  createTicket,
  getTicketByDepartment,
  setResolutionTime,
} from "../controller/ticketController.js";
import { protectedRoute, restrictedTo } from "../middlewares/auth.js";

const router = express.Router();

router.route("/create-ticket").post(protectedRoute, createTicket);
router.route("/:departmentId").get(protectedRoute, getTicketByDepartment);
router
  .route("/set-time/:ticketId")
  .patch(protectedRoute, restrictedTo("admin"), setResolutionTime);

export default router;
