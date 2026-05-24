const express = require("express");
const router = express.Router();
const { getAnalytics, exportAnalyticsCsv } = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAnalytics);
router.get("/export-csv", protect, exportAnalyticsCsv);

module.exports = router;