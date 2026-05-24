const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  uploadFile,
  replaceUpload,
  getMyUploads,
  deleteUpload,
} = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", protect, upload.single("file"), uploadFile);
router.post("/replace", protect, upload.single("file"), replaceUpload);
router.get("/my", protect, getMyUploads);
router.delete("/:id", protect, deleteUpload);

module.exports = router;