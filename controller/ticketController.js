import Ticket from "../models/ticket.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import path from "path";

const createTicket = catchAsync(async (req, res, next) => {
  console.log(req.body, "Request body for creating ticket");
  const { title, description, department, attachments } = req.body;
  const images = req.files; // Multer puts files in req.files for .array()

  // Map image paths if images exist, else empty array
  const imagePaths =
    images && images.length > 0
      ? images.map((img) => `/tickets-assets/${img.filename}`)
      : [];

  const ticket = await Ticket.create({
    title,
    description,
    department,
    attachments,
    createdBy: req.user._id,
    images: imagePaths,
  });

  res.status(201).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

const getTicketByDepartment = catchAsync(async (req, res, next) => {
  const { departmentId } = req.params;

  if (!departmentId) {
    return next(new AppError("Department ID is required", 400));
  }

  const tickets = await Ticket.find({ department: departmentId })
    .populate({
      path: "createdBy",
      select: "name marketId",
      populate: {
        path: "marketId",
        select: "name",
      },
    })
    .populate("department", "name")
    .populate("comments.commentedBy", "name");

  res.status(200).json({
    status: "success",
    data: {
      tickets,
    },
  });
});

const setResolutionTime = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { estimatedResolutionTime, comment } = req.body;

  if (!ticketId || !estimatedResolutionTime) {
    return next(
      new AppError("Ticket ID and estimated resolution time are required", 400)
    );
  }
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }

  if (ticket.status === "Resolved" || ticket.status === "Closed") {
    return next(
      new AppError(
        "Cannot set resolution time for resolved or closed tickets",
        400
      )
    );
  }
  ticket.estimatedResolutionTime = estimatedResolutionTime;
  if (comment) {
    ticket.comments.push({
      comment,
      commentedBy: req.user._id,
    });
  }

  await ticket.save();
  res.status(200).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

const addComment = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { comment } = req.body;

  if (!ticketId || !comment) {
    return next(new AppError("Ticket ID and comment are required", 400));
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }
  ticket.comments.push({
    comment,
    commentedBy: req.user._id,
  });

  await ticket.save();

  res.status(200).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

const setResolvedStatus = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { comment } = req.body;

  if (!ticketId || !comment) {
    return next(new AppError("Ticket ID  and Comment is required", 400));
  }

  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }

  if (ticket.status === "Resolved") {
    return next(new AppError("Ticket is already resolved", 400));
  }

  ticket.status = "Resolved";
  ticket.resolvedAt = Date.now();
  ticket.comments.push({
    comment,
    commentedBy: req.user._id,
  });

  await ticket.save();

  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

const setClosedStatus = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;

  if (!ticketId) {
    return next(new AppError("Ticket ID and comment are required", 400));
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }
  if (ticket.status === "Closed") {
    return next(new AppError("Ticket is already closed", 400));
  }
  ticket.status = "Closed";
  ticket.closedAt = Date.now();

  await ticket.save();

  res.status(200).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

const referDepartment = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { departmentId, comment } = req.body;

  if (!ticketId || !departmentId) {
    return next(new AppError("Ticket ID and department ID are required", 400));
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }
  ticket.department = departmentId;
  ticket.comments.push({
    comment,
    commentedBy: req.user._id,
  });
  ticket.status = "Open";
  await ticket.save();
  res.status(200).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

const getTicketImage = catchAsync(async (req, res) => {
  const filePath = path.join(
    process.cwd(),
    "tickets-assets",
    req.params.filename
  );

  res.sendFile(filePath);
});

export {
  createTicket,
  getTicketByDepartment,
  setResolutionTime,
  addComment,
  setResolvedStatus,
  setClosedStatus,
  referDepartment,
  getTicketImage,
};
