import { Schema, model } from "mongoose";

const departmentSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a market name"],
  },
});

const Market = model("Department", departmentSchema);
export default Market;
