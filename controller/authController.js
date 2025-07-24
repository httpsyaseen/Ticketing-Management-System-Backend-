import User from "../models/user.js";
import catchAsync from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) check if email and password exist
  if (!email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide email and password!",
    });
  }
  //2) check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    return next(new AppError("Invalid username or password", 401));
  }
  //3) if everything ok, send token to client
  const token = signToken(user._id);
  const responseUser = {
    username: user.username,
    name: user.name,
    email: user.email,
    photo: user.photo,
  };
  res.status(200).json({
    status: "success",
    data: {
      user: responseUser,
      token,
    },
  });
});

export { signToken, login };
