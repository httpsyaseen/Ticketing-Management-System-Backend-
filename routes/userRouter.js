import express from "express";
const router = express.Router();
import {
  createuser,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controller/userController.js";
import { protectedRoute, restrictedTo } from "../middlewares/auth.js";
import { login, verifyUser } from "../controller/authController.js";

router.post("/login", login);
router.get("/verify", verifyUser);

router.post(
  "/createuser",
  // protectedRoute,
  // restrictedTo("superadmin"),
  createuser
);

router.get(
  "/getallusers",
  protectedRoute,
  restrictedTo("superadmin"),
  getAllUsers
);

router.patch(
  "/updateuser/:userId",
  protectedRoute,
  restrictedTo("superadmin"),
  updateUser
);

router.patch(
  "/deleteuser/:id",
  protectedRoute,
  restrictedTo("superadmin"),
  deleteUser
);

export default router;
