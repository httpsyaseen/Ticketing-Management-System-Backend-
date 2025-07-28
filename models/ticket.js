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
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Low",
  },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved", "Closed"],
    default: "Open",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // assignedTo: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  comments: [
    {
      comment: String,
      commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  attachments: [{ type: String }],
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

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
