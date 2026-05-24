const mongoose = require("mongoose");

const columnProfileSchema = new mongoose.Schema(
  {
    originalName: { type: String, default: "" },
    normalizedKey: { type: String, default: "" },
    detectedRole: { type: String, default: "general" },
    dataType: { type: String, default: "text" },
    completeness: { type: Number, default: 0 },
    uniqueValues: { type: Number, default: 0 },
  },
  { _id: false }
);

const uploadSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    directionSnapshot: {
      typeName: { type: String, default: "" },
      typeCode: { type: String, default: "" },
      programName: { type: String, default: "" },
      batchName: { type: String, default: "" },
    },

    columnMapping: {
      dob: { type: String, default: "" },
      gender: { type: String, default: "" },
      address: { type: String, default: "" },
      qualification: { type: String, default: "" },
      salesPerson: { type: String, default: "" },
      serviceLetter: { type: String, default: "" },
      al: { type: String, default: "" },
      ol: { type: String, default: "" },
      program: { type: String, default: "" },
      batch: { type: String, default: "" },
      type: { type: String, default: "" },
    },

    rows: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    normalizedRows: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    columns: {
      type: [String],
      default: [],
    },
    columnProfiles: {
      type: [columnProfileSchema],
      default: [],
    },
    rowCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

uploadSchema.index(
  { uploadedBy: 1, typeId: 1, programId: 1, batchId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Upload", uploadSchema);