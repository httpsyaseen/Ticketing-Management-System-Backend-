import Ticket from "../models/ticket.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import path from "path";

const createTicket = catchAsync(async (req, res, next) => {
  const { title, description, assignedTo, assignedToType } = req.body;
  const images = req.files; // Multer puts files in req.files for .array()

  // Map image paths if images exist, else empty array

  const imagePaths =
    images && images.length > 0
      ? images.map(
          (img) =>
            `${req.protocol}://${req.get("host")}/tickets-assets/${
              img.filename
            }`
        )
      : [];

  const ticket = await Ticket.create({
    title,
    description,
    assignedTo,
    assignedToType,
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

  const tickets = await Ticket.find({
    assignedTo: departmentId,
    status: { $ne: "closed" },
  });
  res.status(200).json({
    status: "success",
    data: {
      tickets,
    },
  });
});

const getUsertickets = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const tickets = await Ticket.find({
    createdBy: userId,
    status: { $ne: "closed" },
  });

  res.status(200).json({
    status: "success",
    data: {
      tickets,
    },
  });
});

const setResolutionTime = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { estimatedResolutionTime, priority } = req.body;

  if (!ticketId || !estimatedResolutionTime) {
    return next(
      new AppError("Ticket ID and estimated resolution time are required", 400)
    );
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }

  console.log(ticket, req.user);
  if (!ticket.assignedTo.equals(req.user.assignedTo._id)) {
    return next(
      new AppError("You are not authorized to entertain this ticket", 403)
    );
  }

  if (ticket.status !== "open") {
    return next(
      new AppError("Resolution time can only be set for open tickets", 400)
    );
  }
  ticket.estimatedResolutionTime = estimatedResolutionTime;
  ticket.status = "in-progress";
  ticket.inProgressAt = Date.now();
  ticket.priority = priority || "low"; // Default to low if not provided

  await ticket.save();
  await ticket.populate("comments.commentedBy", "name");
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

  if (ticket.status !== "in-progress") {
    return next(
      new AppError("Ticket is still open or Resolved, cannot add comment", 400)
    );
  }

  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }
  ticket.comments.push({
    comment,
    commentedBy: req.user._id,
  });

  await ticket.save();
  await ticket.populate("comments.commentedBy", "name");

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

  if (ticket.status === "resolved") {
    return next(new AppError("Ticket is already resolved", 400));
  }

  ticket.status = "resolved";
  ticket.resolvedAt = Date.now();
  ticket.comments.push({
    comment,
    commentedBy: req.user._id,
  });

  await ticket.save();
  await ticket.populate("comments.commentedBy", "name");

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
  const { feedback } = req.body;

  if (!ticketId || !feedback) {
    return next(new AppError("Ticket ID and feedback are required", 400));
  }

  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }

  if (!ticket.createdBy.equals(req.user._id)) {
    return next(
      new AppError("You are not authorized to close this ticket", 403)
    );
  }

  if (ticket.status === "closed") {
    return next(new AppError("Ticket is already closed", 400));
  }

  ticket.status = "closed";
  ticket.closedAt = Date.now();
  ticket.comments.push({
    comment: feedback,
    commentedBy: req.user._id,
  });

  await ticket.save();
  await ticket.populate("comments.commentedBy", "name");

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

  console.log(departmentId, comment);

  if (!ticketId || !departmentId) {
    return next(new AppError("Ticket ID and department ID are required", 400));
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }
  ticket.assignedTo = departmentId;
  ticket.comments.push({
    comment,
    commentedBy: req.user._id,
  });
  ticket.status = "open";
  await ticket.save();
  await ticket.populate("comments.commentedBy", "name");
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

const getClosedTicketsByDepartment = catchAsync(async (req, res, next) => {
  const { departmentId } = req.params;
  if (!departmentId) {
    return next(new AppError("Department ID is required", 400));
  }
  const tickets = await Ticket.find({
    department: departmentId,
    status: "closed",
  });

  res.status(200).json({
    status: "success",
    data: {
      tickets,
    },
  });
});

const getUserClosedTickets = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const tickets = await Ticket.find({
    createdBy: userId,
    status: "closed",
  });

  res.status(200).json({
    status: "success",
    data: {
      tickets,
    },
  });
});

const getTicketById = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;

  if (!ticketId) {
    return next(new AppError("Ticket ID is required", 400));
  }

  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }

  if (
    !ticket.createdBy.equals(req.user._id) &&
    !ticket.assignedTo.equals(req.user.assignedTo)
  ) {
    return next(
      new AppError("You are not authorized to view this ticket", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

const getTicketsByDateAndType = catchAsync(async (req, res, next) => {
  const { startDate, endDate, ticketType } = req.body; // or req.body if using POST

  // Validate required parameters
  if (!startDate || !endDate || !ticketType) {
    return next(
      new AppError("Start date, end date, and ticket type are required", 400)
    );
  }

  // Validate ticketType
  if (!["created", "assigned"].includes(ticketType)) {
    return next(
      new AppError("Ticket type must be either 'created' or 'assigned'", 400)
    );
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new AppError("Invalid date format", 400));
  }

  if (start > end) {
    return next(new AppError("Start date cannot be after end date", 400));
  }

  // Set end date to end of day
  end.setHours(23, 59, 59, 999);

  // Build query based on ticket type
  let query = {
    createdAt: {
      $gte: start,
      $lte: end,
    },
    status: "closed",
  };

  if (ticketType === "created") {
    query.createdBy = req.user._id;
  } else if (ticketType === "assigned") {
    query.assignedTo = req.user.assignedTo._id;
  }

  // Execute query
  const tickets = await Ticket.find(query);

  res.status(200).json({
    status: "success",
    results: tickets.length,
    data: {
      tickets,
    },
  });
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
  getUsertickets,
  getUserClosedTickets,
  getClosedTicketsByDepartment,
  getTicketById,
  getTicketsByDateAndType,
};
