const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
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
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
    },
  },
  { timestamps: true }
);

batchSchema.index(
  { name: 1, typeId: 1, programId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Batch", batchSchema);