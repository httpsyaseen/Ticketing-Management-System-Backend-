import { Schema, model } from "mongoose";

const marketSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a market name"],
  },
  location: {
    type: String,
    required: [true, "Please provide a market location"],
  },
});

const Market = model("Market", marketSchema);
export default Market;
