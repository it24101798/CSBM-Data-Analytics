const express = require("express");
const {
  getAllUsers,
  approveUser,
  updateUserPermissions,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getAllUsers);
router.put("/approve/:id", protect, adminOnly, approveUser);
router.put("/permissions/:id", protect, adminOnly, updateUserPermissions);

module.exports = router;