import AppError from "../utils/appError.js";

const handleCasterrorDB = (error) => {
  const message = `Inavlid ${error.path} :${error.value}`;
  return new AppError(message, 400);
};

const handleDuplicatenameDB = (error) => {
  // const duplicateName = error.message.match(/"([^"]*)"/g);
  const duplicateName = error.keyValue.name;
  const message = `Duplicate name: ${duplicateName}. Please use another name`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);
  const message = `Invalid Input Data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError("Invalid JSON Token", 401);
};

const handleJWTExpireError = () => {
  return new AppError("Your token is expired", 401);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //operational. trusted errors send to client
  if (err.operational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //unknow error, that can e a programming error
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

export const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  console.error("Error 💥", err);

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    //use err instead of error beacuse all the properties donot destrucutre to error
    if (err.name === "CastError") error = handleCasterrorDB(err);
    if (err.code === 11000) error = handleDuplicatenameDB(err);
    if (err.name === "ValidationError") error = handleValidationErrorDB(err);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpireError();

    sendErrorProd(error, res);
  }
};
