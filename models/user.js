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
  photo: String,
  // passwordConfirm: {
  //   type: String,
  //   min: [8, "Password must be more than or equal to 8 characters"],
  //   required: [true, "Please Confirm your password"],
  //   validate: {
  //     validator: function (el) {
  //       return el === this.password;
  //     },
  //     message: "Password Doesnot Match",
  //   },
  // },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    default: null,
  },
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Market",
    default: null,
  },
  passwordChangedAt: Date,
  passwordExpiresAt: Date,
  passwordResetLink: String,
});

// userSchema.index({ departmentId: 1, marketId: 1 });

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre("save", function (next) {
  if (this.departmentId && this.marketId) {
    return next(
      new Error(
        "A user can be assigned to either a department or a market, not both."
      )
    );
  }
  next();
});

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

userSchema.methods.isPassChanged = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const passChangedTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return passChangedTime > JWTTimeStamp;
  }
  return false;
};

userSchema.methods.generateResetLink = function () {
  const resetLink = randomBytes(32).toString("hex");

  this.passwordResetLink = createHash("sha256").update(resetLink).digest("hex");

  this.passwordExpiresAt = Date.now() + 10 * 60 * 1000;
  return resetLink;
};
const User = model("User", userSchema);

export default User;
