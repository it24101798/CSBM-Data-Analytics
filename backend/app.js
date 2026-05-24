const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const directionRoutes = require("./routes/directionRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("CSBM Data Analytics API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/directions", directionRoutes);
app.use("/api/admin-analytics", adminAnalyticsRoutes);

module.exports = app;