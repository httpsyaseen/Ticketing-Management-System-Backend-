import { Schema, model } from "mongoose";

const marketSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a market name"],
  },
});

const Market = model("Market", marketSchema);
export default Market;
