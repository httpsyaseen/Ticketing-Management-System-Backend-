import Market from "../models/market.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const createMarket = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  // Check if market already exists
  const existingMarket = await Market.findOne({ name });
  if (existingMarket) {
    return next(new AppError("Market already exists", 400));
  }
  // Create new market
  const newMarket = await Market.create({ name });
  res.status(201).json({
    status: "success",
    data: {
      market: newMarket,
    },
  });
});

const getAllMarkets = catchAsync(async (req, res, next) => {
  const markets = await Market.find();

  res.status(200).json({
    status: "success",
    results: markets.length,
    data: {
      markets,
    },
  });
});
export { createMarket, getAllMarkets };
