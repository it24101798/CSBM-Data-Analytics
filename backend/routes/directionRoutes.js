const express = require("express");
const {
  getTypes,
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
} = require("../controllers/directionController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/types", protect, getTypes);

router.get("/programs", protect, getPrograms);
router.post("/programs", protect, adminOnly, createProgram);
router.put("/programs/:id", protect, adminOnly, updateProgram);
router.delete("/programs/:id", protect, adminOnly, deleteProgram);

router.get("/batches", protect, getBatches);
router.post("/batches", protect, adminOnly, createBatch);
router.put("/batches/:id", protect, adminOnly, updateBatch);
router.delete("/batches/:id", protect, adminOnly, deleteBatch);

module.exports = router;