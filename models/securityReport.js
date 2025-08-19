import { Schema, model } from "mongoose";

const securityReportSchema = new Schema({
  marketId: { type: Schema.Types.ObjectId, ref: "Market", required: true },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: { type: Date },
  isSubmitted: { type: Boolean, default: false },
  totalCCTV: {
    type: Number,
    min: 0,
  },
  faultyCCTV: {
    type: Number,
    min: 0,
  },
  walkthroughGates: {
    type: Number,
    min: 0,
  },
  faultyWalkthroughGates: {
    type: Number,
    min: 0,
  },
  metalDetectors: {
    type: Number,
    min: 0,
  },
  faultyMetalDetectors: {
    type: Number,
    min: 0,
  },
  biometricStatus: {
    type: Boolean,
  },
  comments: {
    type: String,
  },
});

const securityReport = model("SecurityReport", securityReportSchema);

export default securityReport;
