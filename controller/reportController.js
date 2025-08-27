import SecurityReport from "../models/securityReport.js";
import WeeklyReport from "../models/weeklyReport.js";
import Market from "../models/market.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import cron from "node-cron";

const createWeeklyReport = async () => {
  try {
    const createdAt = new Date();

    // Calculate current week's Monday & Sunday range
    const startOfWeek = new Date(createdAt);
    startOfWeek.setHours(0, 0, 4, 0);
    startOfWeek.setDate(createdAt.getDate() - createdAt.getDay() + 1); // Monday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 0);

    // Check if weekly report already exists for this week
    const existingReport = await WeeklyReport.findOne({
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    });

    if (existingReport) {
      console.log(
        `⚠ Weekly report already exists for week starting ${startOfWeek.toDateString()}`
      );
      return;
    }

    // Get all markets
    const markets = await Market.find({}, { _id: 1 }).lean();
    if (!markets || markets.length === 0) {
      console.log("❌ No markets found");
      return;
    }

    // Create all security reports concurrently
    const securityReports = await Promise.all(
      markets.map((market) =>
        SecurityReport.create({
          marketId: market._id,
          createdAt,
        })
      )
    );

    // Prepare all market update queries
    const updateQueries = securityReports.map((report, index) =>
      Market.findByIdAndUpdate(markets[index]._id, {
        currentReport: report._id,
      })
    );

    // Run all updates concurrently
    await Promise.all(updateQueries);

    // Create the weekly report
    await WeeklyReport.create({
      createdAt,
      marketsReport: securityReports.map((report) => report._id),
    });

    console.log(
      "✅ Weekly Security and Surveillance Report created successfully"
    );
  } catch (error) {
    console.error("❌ Error creating weekly report:", error);
  }
};

const scheduleWeeklyReport = () => {
  // Cron expression: '0 6 * * 1' = At 6:00 AM on Monday
  cron.schedule(
    "0 6 * * 1",
    async () => {
      console.log("🔄 Starting weekly report generation...");
      try {
        await createWeeklyReport((error) => {
          if (error) throw error;
        });
        console.log("✅ Weekly report cron job completed successfully");
      } catch (error) {
        console.error("❌ Weekly report cron job failed:", error);
        // You could send notification/email here
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Karachi", // Adjust to your timezone
    }
  );

  console.log(
    "📅 Weekly report cron job scheduled for every Monday at 6:00 AM"
  );
};

const updateSecurityReportById = catchAsync(async (req, res, next) => {
  const { reportId } = req.params;
  const updateData = req.body;
  updateData.isSubmitted = true;
  updateData.updatedAt = Date.now();

  const updatedReport = await SecurityReport.findByIdAndUpdate(
    reportId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedReport) {
    return next(new AppError("No report found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      report: updatedReport,
    },
  });
});

const getWeeklyReport = catchAsync(async (req, res, next) => {
  const report = await WeeklyReport.findOne().sort({ _id: -1 });
  if (!report) {
    return next(new AppError("No report found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      report,
    },
  });
});

const setClearByIt = catchAsync(async (req, res, next) => {
  const { reportId } = req.params;

  // if (user.role !== "IT") {
  //   return next(
  //     new AppError("You are not authorized to clear this report", 403)
  //   );
  // }

  const report = await WeeklyReport.findById(reportId);
  if (!report) {
    return next(new AppError("No report found with that ID", 404));
  }

  report.clearedByIt = true;
  report.clearedByItAt = Date.now();
  await report.save();

  res.status(200).json({
    status: "success",
    data: {
      report,
    },
  });
});

const setClearByMonitoring = catchAsync(async (req, res, next) => {
  const { reportId } = req.params;

  // if (user.role !== "Monitoring") {
  //   return next(
  //     new AppError("You are not authorized to clear this report", 403)
  //   );
  // }

  const report = await WeeklyReport.findById(reportId);
  if (!report) {
    return next(new AppError("No report found with that ID", 404));
  }

  report.clearedByMonitoring = true;
  report.clearedByMonitoringAt = Date.now();
  await report.save();

  res.status(200).json({
    status: "success",
    data: {
      report,
    },
  });
});

const setClearByOperations = catchAsync(async (req, res, next) => {
  const { reportId } = req.params;
  const report = await WeeklyReport.findById(reportId);
  if (!report) {
    return next(new AppError("No report found with that ID", 404));
  }

  report.clearedByOperations = true;
  report.clearedByOperationsAt = Date.now();
  await report.save();

  res.status(200).json({
    status: "success",
    data: {
      report,
    },
  });
});

const getWeeklyReportByDate = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.body;

  const report = await WeeklyReport.find({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  if (!report) {
    return next(new AppError("No report found for this date", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      report,
    },
  });
});

const getWeeklyReportById = catchAsync(async (req, res, next) => {
  const report = await WeeklyReport.findById(req.params.reportId);

  if (!report) {
    return next(new AppError("No report found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      report,
    },
  });
});

export {
  scheduleWeeklyReport,
  createWeeklyReport,
  updateSecurityReportById,
  setClearByIt,
  getWeeklyReport,
  setClearByMonitoring,
  setClearByOperations,
  getWeeklyReportByDate,
  getWeeklyReportById,
};
