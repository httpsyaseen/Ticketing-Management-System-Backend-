import { Schema, model } from "mongoose";

const weeklyReportSchema = new Schema({
  createdAt: { type: Date, default: Date.now, unique: true },
  marketsReport: [
    {
      type: Schema.Types.ObjectId,
      ref: "SecurityReport",
    },
  ],
  clearedByIt: {
    type: Boolean,
    default: false,
  },
  clearedByItAt: {
    type: Date,
    default: null,
  },
  clearedByMonitoring: {
    type: Boolean,
    default: false,
  },
  clearedByMonitoringAt: {
    type: Date,
    default: null,
  },
  clearedByOperations: {
    type: Boolean,
    default: false,
  },
  clearedByOperationsAt: {
    type: Date,
    default: null,
  },
});

weeklyReportSchema.pre(/^find/, function (next) {
  this.populate({
    path: "marketsReport", // First populate the SecurityReports
    populate: {
      path: "marketId", // Then populate the marketId inside SecurityReports
      select: "name", // Choose fields from Market (add any fields you want)
    },
  });
  next();
});

const weeklyReport = model("WeeklyReport", weeklyReportSchema);

export default weeklyReport;
