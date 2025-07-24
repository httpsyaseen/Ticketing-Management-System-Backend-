import express from "express";
const router = express.Router();
import { createuser, getAllUsers } from "../controller/userController.js";
import { protectedRoute, restrictedTo } from "../middlewares/auth.js";
import { login } from "../controller/authController.js";

router.post(
  "/createuser",
  protectedRoute,
  restrictedTo("superadmin"),
  createuser
);

router.post("/login", login);
router.get(
  "/getallusers",
  protectedRoute,
  restrictedTo("superadmin"),
  getAllUsers
);

export default router;
