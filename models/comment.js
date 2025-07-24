import { Schema, model } from "mongoose";

const commentSchema = new Schema({
  comment: {
    type: String,
    required: [true, "Please provide a comment"],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Please provide a user ID"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Comment = model("Comment", commentSchema);
export default Comment;
