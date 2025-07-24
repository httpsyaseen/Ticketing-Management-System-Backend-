import jwt from "jsonwebtoken";
import { promisify } from "util";
import User from "../models/user.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

const protectedRoute = catchAsync(async (req, res, next) => {
  //1. Get token and check if it exists
  let token;
  if (req.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    next(new AppError("Authorized Users Only", 401));
  }

  //2.Verify token and handle 2 Errors
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  //3. Check if user exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError("User does not exist", 401));
  }
  //4. is Pasword Changed After the jwt issues
  const changed = currentUser.isPasswordChangedAfterTokenExpires(decoded.iat);
  if (changed) {
    return next(new AppError("User recently changed password", 401));
  }

  req.user = currentUser;

  next();
});

export function restrictedTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("The user donot have permission to do this action", 403)
      );

    next();
  };
}

export { protectedRoute };
