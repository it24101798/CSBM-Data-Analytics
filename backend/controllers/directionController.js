const DirectionType = require("../models/DirectionType");
const Program = require("../models/Program");
const Batch = require("../models/Batch");

const getTypes = async (req, res) => {
  try {
    const types = await DirectionType.find().sort({ name: 1 });
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch types", error: error.message });
  }
};

const getPrograms = async (req, res) => {
  try {
    const { typeId } = req.query;
    const filter = typeId ? { typeId } : {};

    const programs = await Program.find(filter)
      .populate("typeId", "name code")
      .sort({ name: 1 });

    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch programs", error: error.message });
  }
};

const createProgram = async (req, res) => {
  try {
    const { name, typeId } = req.body;

    if (!name || !typeId) {
      return res.status(400).json({ message: "Program name and type are required." });
    }

    const program = await Program.create({ name, typeId });
    res.status(201).json({ message: "Program created successfully.", program });
  } catch (error) {
    res.status(500).json({ message: "Failed to create program", error: error.message });
  }
};

const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, typeId } = req.body;

    const program = await Program.findByIdAndUpdate(
      id,
      { name, typeId },
      { new: true }
    );

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    res.status(200).json({ message: "Program updated successfully.", program });
  } catch (error) {
    res.status(500).json({ message: "Failed to update program", error: error.message });
  }
};

const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBatch = await Batch.findOne({ programId: id });
    if (existingBatch) {
      return res.status(400).json({
        message: "Cannot delete program. Delete related batches first.",
      });
    }

    const deleted = await Program.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Program not found." });
    }

    res.status(200).json({ message: "Program deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete program", error: error.message });
  }
};

const getBatches = async (req, res) => {
  try {
    const { typeId, programId } = req.query;

    const filter = {};
    if (typeId) filter.typeId = typeId;

    if (programId === "none") {
      filter.programId = null;
    } else if (programId) {
      filter.programId = programId;
    }

    const batches = await Batch.find(filter)
      .populate("typeId", "name code")
      .populate("programId", "name")
      .sort({ name: 1 });

    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch batches", error: error.message });
  }
};

const createBatch = async (req, res) => {
  try {
    const { name, typeId, programId } = req.body;

    if (!name || !typeId) {
      return res.status(400).json({ message: "Batch/Month name and type are required." });
    }

    const type = await DirectionType.findById(typeId);
    if (!type) {
      return res.status(400).json({ message: "Invalid type." });
    }

    const isNewRegistration = type.code === "NEW_REGISTRATION";

    if (!isNewRegistration && !programId) {
      return res.status(400).json({
        message: "Program is required for this type.",
      });
    }

    const batch = await Batch.create({
      name,
      typeId,
      programId: isNewRegistration ? null : programId,
    });

    res.status(201).json({ message: "Batch/Month created successfully.", batch });
  } catch (error) {
    res.status(500).json({ message: "Failed to create batch", error: error.message });
  }
};

const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, typeId, programId } = req.body;

    const type = await DirectionType.findById(typeId);
    if (!type) {
      return res.status(400).json({ message: "Invalid type." });
    }

    const isNewRegistration = type.code === "NEW_REGISTRATION";

    const batch = await Batch.findByIdAndUpdate(
      id,
      {
        name,
        typeId,
        programId: isNewRegistration ? null : programId || null,
      },
      { new: true }
    );

    if (!batch) {
      return res.status(404).json({ message: "Batch not found." });
    }

    res.status(200).json({ message: "Batch updated successfully.", batch });
  } catch (error) {
    res.status(500).json({ message: "Failed to update batch", error: error.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Batch.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Batch not found." });
    }

    res.status(200).json({ message: "Batch deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete batch", error: error.message });
  }
};

module.exports = {
  getTypes,
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
};