import { Schema, model } from "mongoose";

const marketSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a market name"],
  },
  currentReport: {
    type: Schema.Types.ObjectId,
    ref: "SecurityReport",
  },
});

const Market = model("Market", marketSchema);
export default Market;
