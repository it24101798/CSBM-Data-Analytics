const express = require("express");
const router = express.Router();
const {
  getAdminOverview,
  exportAdminSummaryCsv,
} = require("../controllers/adminAnalyticsController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/overview", protect, adminOnly, getAdminOverview);
router.get("/export-csv", protect, adminOnly, exportAdminSummaryCsv);

module.exports = router;