const User = require("../models/User");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User approved successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { canView, canUpload, canUpdate, canDelete } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        permissions: {
          canView,
          canUpload,
          canUpdate,
          canDelete,
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User permissions updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  approveUser,
  updateUserPermissions,
};