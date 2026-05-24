const Upload = require("../models/Upload");
const User = require("../models/User");
const {
  buildLocationCounts,
} = require("../utils/locationIntelligence");

const normalizeText = (value) => String(value ?? "").trim();

const isEmptyValue = (value) =>
  value === null || value === undefined || String(value).trim() === "";

const isTruthyDocumentValue = (value) => {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return false;

  return [
    "yes",
    "y",
    "submitted",
    "available",
    "provided",
    "done",
    "completed",
    "ok",
    "uploaded",
  ].includes(raw);
};

const countBy = (items, getter) => {
  const counts = {};

  items.forEach((item) => {
    const key = normalizeText(getter(item));
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

const safeRowsFromUpload = (upload) => {
  if (Array.isArray(upload.normalizedRows) && upload.normalizedRows.length > 0) {
    return upload.normalizedRows;
  }

  const directionSnapshot = upload.directionSnapshot || {};
  return (upload.rows || []).map((row) => ({
    ...row,
    _directionType: directionSnapshot.typeName || upload.typeId?.name || "",
    _directionProgram: directionSnapshot.programName || upload.programId?.name || "",
    _directionBatch: directionSnapshot.batchName || upload.batchId?.name || "",
    _normalizedAddress: "",
  }));
};

const getMappedColumn = (upload, role) => upload?.columnMapping?.[role] || "";

const buildUploadFilter = (query) => {
  const { userId = "", typeId = "", programId = "", batchId = "" } = query;
  const filter = {};

  if (userId) filter.uploadedBy = userId;
  if (typeId) filter.typeId = typeId;
  if (programId === "none") filter.programId = null;
  else if (programId) filter.programId = programId;
  if (batchId) filter.batchId = batchId;

  return filter;
};

const getAdminOverview = async (req, res) => {
  try {
    const uploads = await Upload.find(buildUploadFilter(req.query))
      .populate("uploadedBy", "name email role")
      .populate("typeId", "name code")
      .populate("programId", "name")
      .populate("batchId", "name")
      .sort({ createdAt: -1 });

    const users = await User.find({}).select("name email role isApproved permissions");

    const totalRows = uploads.reduce((sum, upload) => sum + (upload.rowCount || 0), 0);
    const approvedUsers = users.filter((u) => u.isApproved).length;
    const pendingUsers = users.filter((u) => !u.isApproved).length;

    const allRows = uploads.flatMap(safeRowsFromUpload);

    const uploadByType = countBy(
      uploads,
      (u) => u.typeId?.name || u.directionSnapshot?.typeName || ""
    );

    const uploadByProgram = countBy(
      uploads,
      (u) => u.programId?.name || u.directionSnapshot?.programName || ""
    );

    const rowsByProgram = countBy(
      uploads.flatMap((u) =>
        Array.from({ length: u.rowCount || 0 }).map(() => ({
          value: u.programId?.name || u.directionSnapshot?.programName || "",
        }))
      ),
      (x) => x.value
    );

    const uploadsByUser = countBy(
      uploads,
      (u) => u.uploadedBy?.name || u.uploadedBy?.email || "Unknown User"
    );

    const rowsByUser = countBy(
      uploads.flatMap((u) =>
        Array.from({ length: u.rowCount || 0 }).map(() => ({
          value: u.uploadedBy?.name || u.uploadedBy?.email || "Unknown User",
        }))
      ),
      (x) => x.value
    );

    let missingServiceLetter = 0;
    let missingAL = 0;
    let missingOL = 0;

    uploads.forEach((upload) => {
      const rows = safeRowsFromUpload(upload);
      const serviceCol = getMappedColumn(upload, "serviceLetter");
      const alCol = getMappedColumn(upload, "al");
      const olCol = getMappedColumn(upload, "ol");

      rows.forEach((row) => {
        if (serviceCol && !isTruthyDocumentValue(row[serviceCol])) {
          missingServiceLetter += 1;
        }
        if (alCol && isEmptyValue(row[alCol])) {
          missingAL += 1;
        }
        if (olCol && isEmptyValue(row[olCol])) {
          missingOL += 1;
        }
      });
    });

    const locationStats = buildLocationCounts(
      allRows.map((row) => row._normalizedAddress || "")
    ).slice(0, 10);

    const recentUploads = uploads.slice(0, 20).map((u) => ({
      _id: u._id,
      originalName: u.originalName,
      rowCount: u.rowCount || 0,
      uploadedBy: u.uploadedBy?.name || u.uploadedBy?.email || "Unknown",
      uploadedById: u.uploadedBy?._id || "",
      typeId: u.typeId?._id || "",
      typeName: u.typeId?.name || u.directionSnapshot?.typeName || "",
      programId: u.programId?._id || "",
      programName: u.programId?.name || u.directionSnapshot?.programName || "",
      batchId: u.batchId?._id || "",
      batchName: u.batchId?.name || u.directionSnapshot?.batchName || "",
      createdAt: u.createdAt,
    }));

    const selectableUsers = users
      .filter((u) => u.role !== "admin")
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
      }));

    res.status(200).json({
      summary: {
        totalUsers: users.length,
        approvedUsers,
        pendingUsers,
        totalUploads: uploads.length,
        totalRows,
        totalProgramsWithUploads: uploadByProgram.length,
        missingServiceLetter,
        missingAL,
        missingOL,
      },
      charts: {
        uploadByType,
        uploadByProgram: uploadByProgram.slice(0, 10),
        rowsByProgram: rowsByProgram.slice(0, 10),
        uploadsByUser: uploadsByUser.slice(0, 10),
        rowsByUser: rowsByUser.slice(0, 10),
        locationStats,
      },
      recentUploads,
      filtersMeta: {
        users: selectableUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load admin analytics.",
      error: error.message,
    });
  }
};

const exportAdminSummaryCsv = async (req, res) => {
  try {
    const uploads = await Upload.find(buildUploadFilter(req.query))
      .populate("uploadedBy", "name email")
      .populate("typeId", "name code")
      .populate("programId", "name")
      .populate("batchId", "name")
      .sort({ createdAt: -1 });

    const header = [
      "Uploaded By",
      "Email",
      "Type",
      "Program",
      "Batch",
      "Original Name",
      "Rows",
      "Uploaded At",
    ];

    const rows = uploads.map((u) => [
      u.uploadedBy?.name || "",
      u.uploadedBy?.email || "",
      u.typeId?.name || u.directionSnapshot?.typeName || "",
      u.programId?.name || u.directionSnapshot?.programName || "",
      u.batchId?.name || u.directionSnapshot?.batchName || "",
      u.originalName || "",
      u.rowCount || 0,
      u.createdAt ? new Date(u.createdAt).toISOString() : "",
    ]);

    const csvLines = [
      header.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="csbm-admin-summary.csv"');

    return res.status(200).send(csvLines.join("\n"));
  } catch (error) {
    res.status(500).json({
      message: "Failed to export admin summary.",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminOverview,
  exportAdminSummaryCsv,
};