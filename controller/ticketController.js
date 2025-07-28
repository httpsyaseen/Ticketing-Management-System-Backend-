import Ticket from "../models/ticket.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const createTicket = catchAsync(async (req, res, next) => {
  const { title, description, department, attachments } = req.body;

  const ticket = await Ticket.create({
    title,
    description,
    department,
    attachments,
    createdBy: req.user._id,
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
  const { estimatedResolutionTime } = req.body;

  if (!ticketId || !estimatedResolutionTime) {
    return next(
      new AppError("Ticket ID and estimated resolution time are required", 400)
    );
  }

  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { estimatedResolutionTime, status: "In Progress" },
    { new: true, runValidators: true }
  );

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

export { createTicket, getTicketByDepartment, setResolutionTime, addComment };
