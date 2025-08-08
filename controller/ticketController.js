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
  })
    .populate({
      path: "createdBy",
      select: "name assignedTo",
      populate: {
        path: "assignedTo",
        model: ["Department", "Market"],
      },
    })
    .populate("comments.commentedBy", "name")
    .populate({
      path: "assignedTo",
      model: ["Department", "Market"],
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
    status: { $ne: "Closed" },
  })
    .populate({
      path: "createdBy",
      select: "name assignedTo",
      populate: {
        path: "assignedTo",
        model: ["Department", "Market"],
      },
    })
    .populate("comments.commentedBy", "name")
    .populate({
      path: "assignedTo",
      model: ["Department", "Market"],
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
  const { estimatedResolutionTime } = req.body;

  if (!ticketId || !estimatedResolutionTime) {
    return next(
      new AppError("Ticket ID and estimated resolution time are required", 400)
    );
  }
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }

  if (ticket.status !== "Open") {
    return next(
      new AppError("Resolution time can only be set for open tickets", 400)
    );
  }
  ticket.estimatedResolutionTime = estimatedResolutionTime;
  ticket.status = "In Progress";
  ticket.inProgressAt = Date.now();

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
  ticket.estimatedResolutionTime = undefined;
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

  if (!ticketId) {
    return next(new AppError("Ticket ID and comment are required", 400));
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }
  if (ticket.status === "closed") {
    return next(new AppError("Ticket is already closed", 400));
  }
  ticket.status = "closed";
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
  })

    .populate({
      path: "createdBy",
      select: "name assignedTo",
      populate: {
        path: "assignedTo",
        model: ["Department", "Market"],
      },
    })
    .populate("comments.commentedBy", "name");

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
  })
    .populate({
      path: "createdBy",
      select: "name assignedTo",
      populate: {
        path: "assignedTo",
        model: ["Department", "Market"],
      },
    })
    .populate("comments.commentedBy", "name")
    .populate("department", "name");

  res.status(200).json({
    status: "success",
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
};
