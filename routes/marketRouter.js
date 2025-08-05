import express from "express";
const router = express.Router();
import { createMarket, getAllMarkets } from "../controller/marketController.js";
import { protectedRoute, restrictedTo } from "../middlewares/auth.js";

router
  .route("/create-market")
  .post(protectedRoute, restrictedTo("superadmin", "admin"), createMarket);
// .post(createMarket);
router
  .route("/get-all-markets")
  .get(protectedRoute, restrictedTo("superadmin", "admin"), getAllMarkets);

export default router;
