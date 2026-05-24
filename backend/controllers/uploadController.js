const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const csv = require("csv-parser");
const Upload = require("../models/Upload");
const DirectionType = require("../models/DirectionType");
const Program = require("../models/Program");
const Batch = require("../models/Batch");
const { normalizeSriLankaLocation } = require("../utils/locationIntelligence");

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

const parseCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

const normalizeText = (value) => String(value ?? "").trim();

const isEmptyValue = (value) =>
  value === null || value === undefined || String(value).trim() === "";

const isNumericValue = (value) => {
  if (isEmptyValue(value)) return false;
  return !Number.isNaN(Number(String(value).replace(/,/g, "")));
};

const isDateValue = (value) => {
  if (isEmptyValue(value)) return false;
  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return true;
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(raw)) return true;

  const parsed = new Date(raw);
  return !Number.isNaN(parsed.getTime());
};

const sanitizeHeader = (header) =>
  String(header ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[._-]+/g, " ")
    .replace(/[^\w/ ]+/g, "")
    .trim();

const toKey = (header) =>
  sanitizeHeader(header)
    .toLowerCase()
    .replace(/\//g, " ")
    .replace(/\s+/g, "_");

const ROLE_ALIASES = {
  dob: [
    "dob",
    "date_of_birth",
    "birth_day",
    "birthday",
    "birth_date",
    "date_of_birth_age",
    "age",
  ],
  gender: ["gender", "sex"],
  address: [
    "address",
    "permanent_address",
    "student_address",
    "city",
    "district",
    "location",
    "residence",
    "home_town",
    "hometown",
  ],
  qualification: [
    "qualification",
    "qualifications",
    "educational_qualification",
    "educational_qualifications",
    "education",
    "academic_qualification",
  ],
  salesPerson: [
    "sales_person",
    "salesperson",
    "counselor",
    "counsellor",
    "marketing_executive",
    "marketing_officer",
    "executive",
    "handled_by",
    "agent",
  ],
  serviceLetter: [
    "service_letter",
    "employment_service_letter",
    "employment_letter",
    "service_letter_if_available",
  ],
  al: ["a_l", "a l", "al", "advanced_level", "a_level", "alevels"],
  ol: ["o_l", "o l", "ol", "ordinary_level", "o_level", "olevels"],
  program: ["program", "programme", "course", "selected_program"],
  batch: ["batch", "month", "session", "intake"],
  type: ["type", "category", "registration_type"],
};

const detectRoleFromHeader = (header) => {
  const key = toKey(header);

  for (const [role, aliases] of Object.entries(ROLE_ALIASES)) {
    if (aliases.includes(key)) return role;
  }

  if (key.includes("program") || key.includes("programme")) return "program";
  if (key.includes("batch") || key.includes("month") || key.includes("session")) return "batch";
  if (key.includes("gender") || key.includes("sex")) return "gender";
  if (key.includes("sales") || key.includes("counsel") || key.includes("marketing")) return "salesPerson";
  if (key.includes("address") || key.includes("location") || key.includes("city") || key.includes("district")) return "address";
  if (key.includes("qualification") || key.includes("education")) return "qualification";
  if (key.includes("birth") || key.includes("dob") || key === "age") return "dob";
  if (key.includes("service")) return "serviceLetter";
  if (key === "a_l" || key.includes("advanced")) return "al";
  if (key === "o_l" || key.includes("ordinary")) return "ol";
  if (key.includes("type")) return "type";

  return "general";
};

const getDataType = (values) => {
  const nonEmpty = values.filter((v) => !isEmptyValue(v));
  if (nonEmpty.length === 0) return "text";

  let numericCount = 0;
  let dateCount = 0;

  for (const value of nonEmpty) {
    if (isNumericValue(value)) numericCount += 1;
    if (isDateValue(value)) dateCount += 1;
  }

  const numericRatio = numericCount / nonEmpty.length;
  const dateRatio = dateCount / nonEmpty.length;
  const uniqueValues = new Set(nonEmpty.map((v) => normalizeText(v))).size;

  if (numericRatio >= 0.8) return "numeric";
  if (dateRatio >= 0.7) return "date";
  if (uniqueValues <= 15) return "categorical";
  return "text";
};

const ensureUniqueHeaders = (headers = []) => {
  const used = {};

  return headers.map((header, index) => {
    let candidate = sanitizeHeader(header);
    if (!candidate) candidate = `Column ${index + 1}`;

    if (!used[candidate]) {
      used[candidate] = 1;
      return candidate;
    }

    used[candidate] += 1;
    return `${candidate} (${used[candidate]})`;
  });
};

const normalizeRawRows = (rawRows) => {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

  const rawHeaders = Object.keys(rawRows[0] || {});
  const uniqueHeaders = ensureUniqueHeaders(rawHeaders);

  return rawRows
    .map((row) => {
      const cleanedRow = {};
      rawHeaders.forEach((originalKey, index) => {
        cleanedRow[uniqueHeaders[index]] = row[originalKey];
      });
      return cleanedRow;
    })
    .filter((row) => Object.values(row).some((value) => !isEmptyValue(value)));
};

const buildColumnArtifacts = (rows) => {
  const columns = rows.length > 0 ? Object.keys(rows[0]).map(sanitizeHeader) : [];

  const columnMapping = {
    dob: "",
    gender: "",
    address: "",
    qualification: "",
    salesPerson: "",
    serviceLetter: "",
    al: "",
    ol: "",
    program: "",
    batch: "",
    type: "",
  };

  const columnProfiles = columns.map((column) => {
    const values = rows.map((row) => row[column]);
    const nonEmpty = values.filter((v) => !isEmptyValue(v));
    const detectedRole = detectRoleFromHeader(column);
    const dataType = getDataType(values);
    const uniqueValues = new Set(nonEmpty.map((v) => normalizeText(v))).size;
    const completeness = values.length
      ? Math.round((nonEmpty.length / values.length) * 100)
      : 0;

    if (detectedRole !== "general" && !columnMapping[detectedRole]) {
      columnMapping[detectedRole] = column;
    }

    return {
      originalName: column,
      normalizedKey: toKey(column),
      detectedRole,
      dataType,
      completeness,
      uniqueValues,
    };
  });

  return { columns, columnMapping, columnProfiles };
};

const buildNormalizedRows = (rows, columnMapping, directionSnapshot) => {
  return rows.map((row) => {
    const normalized = {};

    Object.keys(row).forEach((key) => {
      normalized[sanitizeHeader(key)] = row[key];
    });

    normalized._directionType = directionSnapshot.typeName || "";
    normalized._directionProgram = directionSnapshot.programName || "";
    normalized._directionBatch = directionSnapshot.batchName || "";

    const rawAddress =
      columnMapping.address && normalized[columnMapping.address]
        ? normalized[columnMapping.address]
        : "";

    normalized._normalizedAddress = normalizeSriLankaLocation(rawAddress);

    return normalized;
  });
};

const parseIncomingFile = async (file) => {
  const filePath = file.path;
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error("Unsupported file format. Please upload CSV, XLSX, or XLS files only.");
  }

  let rawRows = [];

  if (ext === ".csv") {
    rawRows = await parseCsvFile(filePath);
  } else {
    const workbook = XLSX.readFile(filePath);
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) {
      throw new Error("The uploaded workbook has no readable sheets.");
    }

    const worksheet = workbook.Sheets[firstSheet];
    rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  }

  const rows = normalizeRawRows(rawRows);

  if (!rows.length) {
    throw new Error("The uploaded file is empty or contains only blank rows.");
  }

  return rows;
};

const safeDeletePhysicalFile = (fileName) => {
  if (!fileName) return;
  const fullPath = path.join(process.cwd(), "uploads", fileName);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

const buildDirectionFilter = ({ typeId, programId, batchId, isNewRegistration }) => {
  const filter = {
    typeId,
    batchId,
  };

  if (isNewRegistration) {
    filter.$or = [{ programId: null }, { programId: { $exists: false } }];
  } else {
    filter.programId = programId;
  }

  return filter;
};

const getUploadTypeCode = (upload) =>
  upload?.directionSnapshot?.typeCode || upload?.typeId?.code || "";

const getUploadFieldId = (upload, fieldName) => {
  const value = upload?.[fieldName];

  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?._id) return String(value._id);

  return String(value);
};

const getSharedDirectionKeyFromUpload = (upload) => {
  const typeId = getUploadFieldId(upload, "typeId");
  const batchId = getUploadFieldId(upload, "batchId");
  const typeCode = getUploadTypeCode(upload);
  const programId = typeCode === "NEW_REGISTRATION" ? "none" : getUploadFieldId(upload, "programId") || "none";

  return `${typeId}__${programId}__${batchId}`;
};

const pickLatestUniqueUploads = (uploads = []) => {
  const latestMap = new Map();

  uploads.forEach((upload) => {
    const key = getSharedDirectionKeyFromUpload(upload);
    const currentTime = new Date(upload.updatedAt || upload.createdAt || 0).getTime();

    if (!latestMap.has(key)) {
      latestMap.set(key, upload);
      return;
    }

    const existing = latestMap.get(key);
    const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();

    if (currentTime >= existingTime) {
      latestMap.set(key, upload);
    }
  });

  return Array.from(latestMap.values()).sort(
    (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
  );
};

const saveUploadDocument = async ({ file, userId, type, program, batch }) => {
  const rows = await parseIncomingFile(file);
  const { columns, columnMapping, columnProfiles } = buildColumnArtifacts(rows);

  if (!columns.length) {
    throw new Error("No valid columns were detected in the uploaded file.");
  }

  const directionSnapshot = {
    typeName: type.name || "",
    typeCode: type.code || "",
    programName: type.code === "NEW_REGISTRATION" ? "" : program?.name || "",
    batchName: batch.name || "",
  };

  const normalizedRows = buildNormalizedRows(rows, columnMapping, directionSnapshot);

  return {
    fileName: file.filename,
    originalName: file.originalname,
    uploadedBy: userId,
    typeId: type._id,
    programId: type.code === "NEW_REGISTRATION" ? null : program?._id || null,
    batchId: batch._id,
    directionSnapshot,
    columnMapping,
    rows,
    normalizedRows,
    columns,
    columnProfiles,
    rowCount: rows.length,
  };
};

const validateDirection = async ({ typeId, programId, batchId }) => {
  if (!typeId || !batchId) {
    throw new Error("Type and Batch/Month are required.");
  }

  const type = await DirectionType.findById(typeId);
  const batch = await Batch.findById(batchId);
  const program = programId ? await Program.findById(programId) : null;

  if (!type || !batch) {
    throw new Error("Invalid direction selection.");
  }

  const isNewRegistration = type.code === "NEW_REGISTRATION";

  if (!isNewRegistration && !program) {
    throw new Error("Program is required for this type.");
  }

  return { type, batch, program, isNewRegistration };
};

const canDeleteSharedData = (user) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return !!user.permissions?.canDelete;
};

const uploadFile = async (req, res) => {
  try {
    const { typeId, programId, batchId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const { type, batch, program, isNewRegistration } = await validateDirection({
      typeId,
      programId,
      batchId,
    });

    const directionFilter = buildDirectionFilter({
      typeId,
      programId,
      batchId,
      isNewRegistration,
    });

    const existingRawUploads = await Upload.find(directionFilter).sort({ updatedAt: -1, createdAt: -1 });
    const existingUpload = pickLatestUniqueUploads(existingRawUploads)[0] || null;

    if (existingUpload) {
      return res.status(400).json({
        message:
          "A shared file already exists for this direction. Use replace upload if you want to update it.",
      });
    }

    const payload = await saveUploadDocument({
      file: req.file,
      userId: req.user._id,
      type,
      program,
      batch,
    });

    const savedUpload = await Upload.create(payload);

    res.status(201).json({
      message: "File uploaded and parsed successfully.",
      upload: savedUpload,
      extraction: {
        rowCount: payload.rowCount,
        columnCount: payload.columns.length,
        columns: payload.columns,
        sampleRows: payload.rows.slice(0, 5),
        columnMapping: payload.columnMapping,
        warnings: payload.rowCount < 3 ? ["Very small dataset uploaded."] : [],
      },
    });
  } catch (error) {
    if (req.file?.filename) safeDeletePhysicalFile(req.file.filename);

    res.status(500).json({
      message: "Upload failed.",
      error: error.message,
    });
  }
};

const replaceUpload = async (req, res) => {
  try {
    const { typeId, programId, batchId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const { type, batch, program, isNewRegistration } = await validateDirection({
      typeId,
      programId,
      batchId,
    });

    const directionFilter = buildDirectionFilter({
      typeId,
      programId,
      batchId,
      isNewRegistration,
    });

    const existingRawUploads = await Upload.find(directionFilter).sort({ updatedAt: -1, createdAt: -1 });
    const uniqueUploads = pickLatestUniqueUploads(existingRawUploads);
    const existingUpload = uniqueUploads[0] || null;

    if (!existingUpload) {
      return res.status(404).json({
        message: "No existing shared upload found for this direction to replace.",
      });
    }

    const payload = await saveUploadDocument({
      file: req.file,
      userId: req.user._id,
      type,
      program,
      batch,
    });

    safeDeletePhysicalFile(existingUpload.fileName);

    Object.assign(existingUpload, payload);
    await existingUpload.save();

    // clean legacy duplicates for the same direction
    const legacyDuplicates = existingRawUploads.filter(
      (item) => String(item._id) !== String(existingUpload._id)
    );

    for (const duplicate of legacyDuplicates) {
      safeDeletePhysicalFile(duplicate.fileName);
      await Upload.findByIdAndDelete(duplicate._id);
    }

    res.status(200).json({
      message: "Shared upload replaced successfully.",
      upload: existingUpload,
      extraction: {
        rowCount: payload.rowCount,
        columnCount: payload.columns.length,
        columns: payload.columns,
        sampleRows: payload.rows.slice(0, 5),
        columnMapping: payload.columnMapping,
        warnings: payload.rowCount < 3 ? ["Very small dataset uploaded."] : [],
      },
    });
  } catch (error) {
    if (req.file?.filename) safeDeletePhysicalFile(req.file.filename);

    res.status(500).json({
      message: "Replace upload failed.",
      error: error.message,
    });
  }
};

const getMyUploads = async (req, res) => {
  try {
    const rawUploads = await Upload.find({})
      .populate("uploadedBy", "name email")
      .populate("typeId", "name code")
      .populate("programId", "name")
      .populate("batchId", "name")
      .sort({ updatedAt: -1, createdAt: -1 });

    const uploads = pickLatestUniqueUploads(rawUploads);

    res.status(200).json(uploads);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch uploads.",
      error: error.message,
    });
  }
};

const deleteUpload = async (req, res) => {
  try {
    const { id } = req.params;

    const upload = await Upload.findById(id);
    if (!upload) {
      return res.status(404).json({ message: "Upload not found." });
    }

    if (!canDeleteSharedData(req.user)) {
      return res.status(403).json({
        message: "You do not have permission to delete shared uploads.",
      });
    }

    safeDeletePhysicalFile(upload.fileName);
    await Upload.findByIdAndDelete(id);

    res.status(200).json({ message: "Upload deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete upload.",
      error: error.message,
    });
  }
};

module.exports = {
  uploadFile,
  replaceUpload,
  getMyUploads,
  deleteUpload,
};