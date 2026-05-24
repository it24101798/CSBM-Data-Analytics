const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    typeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DirectionType",
      required: true,
    },
  },
  { timestamps: true }
);

programSchema.index({ name: 1, typeId: 1 }, { unique: true });

module.exports = mongoose.model("Program", programSchema);