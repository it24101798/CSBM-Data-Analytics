const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    permissions: {
      canView: { type: Boolean, default: false },
      canUpload: { type: Boolean, default: false },
      canUpdate: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);