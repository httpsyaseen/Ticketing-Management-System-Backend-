import express from "express";
const router = express.Router();
import { protectedRoute } from "../middlewares/auth.js";
import { getTicketImage } from "../controller/ticketController.js";

router.route("/:filename").get(protectedRoute, getTicketImage);

export default router;
