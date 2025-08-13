import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "assignedToType",
    required: true,
  },

  assignedToType: {
    type: String,
    enum: ["Department", "Market"],
    required: true,
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "low",
  },
  status: {
    type: String,
    enum: ["open", "in-progress", "resolved", "closed"],
    default: "open",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  resolvedAt: {
    type: Date,
  },

  closedAt: {
    type: Date,
  },

  inProgressAt: {
    type: Date,
  },

  comments: [
    {
      comment: String,
      commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  images: {
    type: [String],
    default: [],
  },

  estimatedResolutionTime: {
    type: Date,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ticketSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

ticketSchema.pre(/^find/, function (next) {
  this.populate({
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
    })
    .sort({ createdAt: -1 });

  next();
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
