import { Schema, model, mongoose } from "mongoose";
import pkg from "validator";
const { isEmail } = pkg;
import { hash, compare } from "bcrypt";
import { randomBytes, createHash } from "crypto";

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },
  email: {
    type: String,
    unique: true,
    low: true,
    required: [true, "Pleae provide an Email"],
    validate: [isEmail, "Please Provide a valid email"],
  },

  password: {
    type: String,
    minlength: [8, "Password must be more than or equal to 8 characters"],
    required: [true, "Please provide a password"],
    select: false,
  },

  role: {
    type: String,
    default: "user",
    enum: ["user", "admin", "superadmin"],
    required: [true, "Please provide a role"],
  },

  active: {
    type: Boolean,
    default: true,
    select: false,
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "assignedToType",
    required: true,
  },

  assignedToType: {
    type: String,
    enum: ["Department", "Market"],
    required: true,
  },

  passwordChangedAt: Date,
});

// userSchema.index({ departmentId: 1, marketId: 1 });

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// userSchema.pre("save", function (next) {
//   if (this.departmentId && this.marketId) {
//     return next(
//       new Error(
//         "A user can be assigned to either a department or a market, not both."
//       )
//     );
//   }
//   next();
// });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.isPasswordCorrect = async function (candiatepass, userpass) {
  return await compare(candiatepass, userpass);
};

userSchema.methods.isPasswordChangedAfterTokenExpires = function (
  JWTTimeStamp
) {
  if (this.passwordChangedAt) {
    const passChangedTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return passChangedTime > JWTTimeStamp;
  }
  return false;
};

const User = model("User", userSchema);

export default User;
