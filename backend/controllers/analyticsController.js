const Upload = require("../models/Upload");
const { buildLocationCounts } = require("../utils/locationIntelligence");
const {
  LOCATION_COORDINATES,
  LOCATION_ALIASES,
} = require("../utils/locationCoordinates");

const normalizeText = (value) => String(value ?? "").trim();

const normalizeLocationKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[.,/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const detectLocationFromText = (text) => {
  const normalized = normalizeLocationKey(text);
  if (!normalized) return null;

  if (LOCATION_COORDINATES[normalized]) return normalized;
  if (LOCATION_ALIASES[normalized]) return LOCATION_ALIASES[normalized];

  const aliasMatch = Object.keys(LOCATION_ALIASES).find((alias) =>
    normalized.includes(alias)
  );
  if (aliasMatch) return LOCATION_ALIASES[aliasMatch];

  const directMatch = Object.keys(LOCATION_COORDINATES).find((key) =>
    normalized.includes(key)
  );
  if (directMatch) return directMatch;

  return null;
};

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

const getAgeGroup = (value) => {
  if (isEmptyValue(value)) return null;

  const raw = String(value).trim();
  const numericAge = Number(raw);

  if (!Number.isNaN(numericAge) && numericAge > 0 && numericAge < 100) {
    if (numericAge <= 20) return "18-20";
    if (numericAge <= 25) return "21-25";
    if (numericAge <= 30) return "26-30";
    if (numericAge <= 40) return "31-40";
    return "41+";
  }

  if (isDateValue(raw)) {
    const date = new Date(raw);
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age--;
    if (age <= 20) return "18-20";
    if (age <= 25) return "21-25";
    if (age <= 30) return "26-30";
    if (age <= 40) return "31-40";
    return "41+";
  }

  return null;
};

const ROLE_ALIASES = {
  dob: ["dob", "date_of_birth", "birth_day", "birthday", "birth_date", "age"],
  gender: ["gender", "sex"],
  address: ["address", "permanent_address", "city", "district", "location"],
  qualification: [
    "qualification",
    "qualifications",
    "educational_qualification",
    "educational_qualifications",
    "education",
  ],
  salesPerson: [
    "sales_person",
    "salesperson",
    "counselor",
    "counsellor",
    "marketing_executive",
    "marketing_officer",
    "executive",
    "agent",
  ],
  serviceLetter: ["service_letter", "employment_letter", "employment_service_letter"],
  al: ["a_l", "al", "advanced_level", "a_level"],
  ol: ["o_l", "ol", "ordinary_level", "o_level"],
  program: ["program", "programme", "course"],
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

const buildValueCounts = (rows, column, transform) => {
  const counts = {};

  rows.forEach((row) => {
    const rawValue = row[column];
    const value = transform ? transform(rawValue) : normalizeText(rawValue);
    if (!value) return;
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

const detectColumnMeta = (rows, columns, roleResolver) => {
  return columns.map((column) => {
    const values = rows.map((row) => row[column]);
    const nonEmpty = values.filter((v) => !isEmptyValue(v));
    const missingCount = values.length - nonEmpty.length;
    const uniqueValues = new Set(nonEmpty.map((v) => normalizeText(v))).size;

    let numericCount = 0;
    let dateCount = 0;

    nonEmpty.forEach((value) => {
      if (isNumericValue(value)) numericCount += 1;
      if (isDateValue(value)) dateCount += 1;
    });

    const totalNonEmpty = nonEmpty.length || 1;
    const numericRatio = numericCount / totalNonEmpty;
    const dateRatio = dateCount / totalNonEmpty;

    let dataType = "text";
    if (numericRatio >= 0.8) dataType = "numeric";
    else if (dateRatio >= 0.7) dataType = "date";
    else if (uniqueValues <= 15) dataType = "categorical";

    return {
      name: column,
      role: roleResolver(column),
      dataType,
      missingCount,
      nonEmptyCount: nonEmpty.length,
      uniqueValues,
      completeness: values.length ? Math.round((nonEmpty.length / values.length) * 100) : 0,
    };
  });
};

const buildRoleResolver = (uploads) => {
  const mappingLookup = {};

  uploads.forEach((upload) => {
    const mapping = upload.columnMapping || {};
    Object.entries(mapping).forEach(([role, columnName]) => {
      if (columnName) mappingLookup[columnName] = role;
    });
  });

  return (columnName) => mappingLookup[columnName] || detectRoleFromHeader(columnName);
};

const calculateReadiness = (row, serviceMeta, alMeta, olMeta) => {
  const hasService = serviceMeta ? isTruthyDocumentValue(row[serviceMeta.name]) : true;
  const hasAL = alMeta ? !isEmptyValue(row[alMeta.name]) : true;
  const hasOL = olMeta ? !isEmptyValue(row[olMeta.name]) : true;
  return hasService && hasAL && hasOL;
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

const buildRecommendedCharts = (rows, columnMeta) => {
  const charts = [];
  const usedKeys = new Set();

  const findMetaByRole = (role) => columnMeta.find((c) => c.role === role);
  const findMetaByType = (type) =>
    columnMeta.filter((c) => c.dataType === type && c.nonEmptyCount > 0);

  const pushCategoricalChart = (
    columnName,
    title,
    chartType = "bar",
    top = 10,
    transform = null
  ) => {
    if (!columnName || usedKeys.has(title)) return;

    const data = buildValueCounts(rows, columnName, transform).slice(0, top);
    if (data.length < 1) return;

    usedKeys.add(title);
    charts.push({
      key: `${columnName}-${title}`,
      title,
      chartType,
      column: columnName,
      data,
    });
  };

  const programMeta = findMetaByRole("program");
  const genderMeta = findMetaByRole("gender");
  const salesMeta = findMetaByRole("salesPerson");
  const qualMeta = findMetaByRole("qualification");
  const locationMeta = findMetaByRole("address");
  const dobMeta = findMetaByRole("dob");
  const serviceMeta = findMetaByRole("serviceLetter");
  const alMeta = findMetaByRole("al");
  const olMeta = findMetaByRole("ol");

  if (programMeta) {
    pushCategoricalChart(programMeta.name, "Student Count by Program", "bar");
  } else {
    const fallbackProgramData = {};
    rows.forEach((row) => {
      const value = normalizeText(row._directionProgram);
      if (!value) return;
      fallbackProgramData[value] = (fallbackProgramData[value] || 0) + 1;
    });
    const data = Object.entries(fallbackProgramData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (data.length > 0) {
      charts.push({
        key: "direction-program",
        title: "Student Count by Program",
        chartType: "bar",
        column: "_directionProgram",
        data,
      });
    }
  }

  if (genderMeta) pushCategoricalChart(genderMeta.name, "Gender Distribution", "pie");
  if (salesMeta) pushCategoricalChart(salesMeta.name, "Top Performing Sales Persons", "bar");
  if (qualMeta) pushCategoricalChart(qualMeta.name, "Qualification Distribution", "bar");

  if (locationMeta) {
    const locationData = buildLocationCounts(rows.map((row) => row[locationMeta.name])).slice(0, 10);
    if (locationData.length > 0) {
      charts.push({
        key: `${locationMeta.name}-top-location`,
        title: "Top Student Locations",
        chartType: "bar",
        column: locationMeta.name,
        data: locationData,
      });
    }
  } else {
    const fallbackLocationData = buildLocationCounts(rows.map((row) => row._normalizedAddress)).slice(0, 10);
    if (fallbackLocationData.length > 0) {
      charts.push({
        key: "normalized-location-fallback",
        title: "Top Student Locations",
        chartType: "bar",
        column: "_normalizedAddress",
        data: fallbackLocationData,
      });
    }
  }

  if (dobMeta) {
    const ageCounts = {};
    rows.forEach((row) => {
      const ageGroup = getAgeGroup(row[dobMeta.name]);
      if (!ageGroup) return;
      ageCounts[ageGroup] = (ageCounts[ageGroup] || 0) + 1;
    });

    const desiredOrder = ["18-20", "21-25", "26-30", "31-40", "41+"];
    const ageData = desiredOrder
      .filter((label) => ageCounts[label])
      .map((name) => ({ name, value: ageCounts[name] }));

    if (ageData.length > 0) {
      charts.push({
        key: `${dobMeta.name}-age-group`,
        title: "Age Group Breakdown",
        chartType: "bar",
        column: dobMeta.name,
        data: ageData,
      });
    }
  }

  if (serviceMeta) {
    const data = [
      {
        name: "Missing Service Letter",
        value: rows.filter((r) => !isTruthyDocumentValue(r[serviceMeta.name])).length,
      },
      {
        name: "Available Service Letter",
        value: rows.filter((r) => isTruthyDocumentValue(r[serviceMeta.name])).length,
      },
    ];
    charts.push({
      key: `${serviceMeta.name}-service-status`,
      title: "Service Letter Status",
      chartType: "pie",
      column: serviceMeta.name,
      data,
    });
  }

  if (alMeta) {
    const data = [
      { name: "Missing A/L", value: rows.filter((r) => isEmptyValue(r[alMeta.name])).length },
      { name: "Available A/L", value: rows.filter((r) => !isEmptyValue(r[alMeta.name])).length },
    ];
    charts.push({
      key: `${alMeta.name}-al-status`,
      title: "A/L Certificate Status",
      chartType: "pie",
      column: alMeta.name,
      data,
    });
  }

  if (olMeta) {
    const data = [
      { name: "Missing O/L", value: rows.filter((r) => isEmptyValue(r[olMeta.name])).length },
      { name: "Available O/L", value: rows.filter((r) => !isEmptyValue(r[olMeta.name])).length },
    ];
    charts.push({
      key: `${olMeta.name}-ol-status`,
      title: "O/L Certificate Status",
      chartType: "pie",
      column: olMeta.name,
      data,
    });
  }

  if (serviceMeta || alMeta || olMeta) {
    const readyCount = rows.filter((row) => calculateReadiness(row, serviceMeta, alMeta, olMeta)).length;
    const pendingCount = rows.length - readyCount;

    charts.push({
      key: "registration-readiness",
      title: "Registration Readiness Status",
      chartType: "pie",
      column: "document-readiness",
      data: [
        { name: "Ready for Registration", value: readyCount },
        { name: "Pending Documents", value: pendingCount },
      ],
    });
  }

  const extraCategorical = findMetaByType("categorical")
    .filter((c) => !["program", "gender", "salesPerson", "qualification", "address", "dob", "serviceLetter", "al", "ol"].includes(c.role))
    .filter((c) => c.uniqueValues > 1 && c.uniqueValues <= 12)
    .slice(0, 3);

  extraCategorical.forEach((meta) => {
    pushCategoricalChart(meta.name, `${meta.name} Distribution`, "bar");
  });

  return charts;
};

const getFilteredUploads = async (req) => {
  const { typeId = "", programId = "", batchId = "" } = req.query;

  const filter = {};
  if (typeId) filter.typeId = typeId;
  if (programId === "none") filter.programId = null;
  else if (programId) filter.programId = programId;
  if (batchId) filter.batchId = batchId;

  const rawUploads = await Upload.find(filter)
    .populate("typeId", "name code")
    .populate("programId", "name")
    .populate("batchId", "name")
    .sort({ updatedAt: -1, createdAt: -1 });

  return pickLatestUniqueUploads(rawUploads);
};

const buildAnalyticsPayload = async (req) => {
  const uploads = await getFilteredUploads(req);

  const allRows = uploads.flatMap((upload) => {
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
  });

  const totalRows = allRows.length;
  const totalUploads = uploads.length;

  if (!uploads.length || !allRows.length) {
    return {
      summary: {
        totalRows: 0,
        totalUploads: 0,
        mostPopularProgram: "Not available",
        topSalesPerson: "Not available",
        topLocation: "Not available",
        dominantQualification: "Not available",
        readyForRegistration: 0,
        readinessPercentage: 0,
        dataQualityScore: 0,
        totalCharts: 0,
      },
      uploads: [],
      preview: {
        columns: [],
        rowCount: 0,
        columnCount: 0,
        sampleRows: [],
      },
      columnMeta: [],
      charts: [],
      pendingStats: {
        missingServiceLetter: 0,
        missingAL: 0,
        missingOL: 0,
      },
      locationStats: [],
      mapPins: [],
      topFindings: ["No uploaded data is available for the current filter."],
    };
  }

  const columnSet = new Set();
  allRows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!key.startsWith("_")) columnSet.add(key);
    });
  });

  const columns = Array.from(columnSet);
  const roleResolver = buildRoleResolver(uploads);
  const columnMeta = detectColumnMeta(allRows, columns, roleResolver);
  const charts = buildRecommendedCharts(allRows, columnMeta);

  const salesMeta = columnMeta.find((c) => c.role === "salesPerson");
  const locationMeta = columnMeta.find((c) => c.role === "address");
  const qualificationMeta = columnMeta.find((c) => c.role === "qualification");
  const programMeta = columnMeta.find((c) => c.role === "program");
  const serviceMeta = columnMeta.find((c) => c.role === "serviceLetter");
  const alMeta = columnMeta.find((c) => c.role === "al");
  const olMeta = columnMeta.find((c) => c.role === "ol");

  const salesStats = salesMeta ? buildValueCounts(allRows, salesMeta.name) : [];

  let locationStats = [];
  if (locationMeta) {
    locationStats = buildLocationCounts(allRows.map((row) => row[locationMeta.name]));
  } else {
    locationStats = buildLocationCounts(allRows.map((row) => row._normalizedAddress));
  }

  const mapPins = locationStats
    .map((loc) => {
      const key = detectLocationFromText(loc.name);
      if (!key) return null;

      const coords = LOCATION_COORDINATES[key];
      if (!coords) return null;

      return {
        name: loc.name,
        count: loc.value,
        lat: coords.lat,
        lng: coords.lng,
      };
    })
    .filter(Boolean);

  const qualificationStats = qualificationMeta
    ? buildValueCounts(allRows, qualificationMeta.name)
    : [];

  let programStats = [];
  if (programMeta) {
    programStats = buildValueCounts(allRows, programMeta.name);
  } else {
    const fallback = {};
    allRows.forEach((row) => {
      const value = normalizeText(row._directionProgram);
      if (!value) return;
      fallback[value] = (fallback[value] || 0) + 1;
    });

    programStats = Object.entries(fallback)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  const pendingStats = {
    missingServiceLetter: serviceMeta
      ? allRows.filter((row) => !isTruthyDocumentValue(row[serviceMeta.name])).length
      : 0,
    missingAL: alMeta
      ? allRows.filter((row) => isEmptyValue(row[alMeta.name])).length
      : 0,
    missingOL: olMeta
      ? allRows.filter((row) => isEmptyValue(row[olMeta.name])).length
      : 0,
  };

  const readyForRegistration =
    serviceMeta || alMeta || olMeta
      ? allRows.filter((row) => calculateReadiness(row, serviceMeta, alMeta, olMeta)).length
      : 0;

  const readinessPercentage =
    totalRows > 0 ? Math.round((readyForRegistration / totalRows) * 100) : 0;

  const avgCompleteness =
    columnMeta.length > 0
      ? Math.round(
          columnMeta.reduce((sum, col) => sum + (col.completeness || 0), 0) / columnMeta.length
        )
      : 0;

  const topFindings = [];

  if (programStats[0]?.name) topFindings.push(`Most popular program: ${programStats[0].name}`);
  if (salesStats[0]?.name) topFindings.push(`Top sales person: ${salesStats[0].name}`);
  if (locationStats[0]?.name) topFindings.push(`Top student location: ${locationStats[0].name}`);
  if (qualificationStats[0]?.name) topFindings.push(`Dominant qualification: ${qualificationStats[0].name}`);
  if (readyForRegistration > 0) {
    topFindings.push(`${readinessPercentage}% of the selected records appear ready for registration`);
  }
  if (mapPins.length > 0) {
    topFindings.push(`${mapPins.length} mapped location points are available for the current filter`);
  }
  if (!topFindings.length) {
    topFindings.push("No strong findings were detected for the current filter.");
  }

  return {
    summary: {
      totalRows,
      totalUploads,
      mostPopularProgram:
        programStats[0]?.name ||
        (uploads[0]?.typeId?.code === "NEW_REGISTRATION" ? "Not needed" : "Not available"),
      topSalesPerson: salesStats[0]?.name || "Not available",
      topLocation: locationStats[0]?.name || "Not available",
      dominantQualification: qualificationStats[0]?.name || "Not available",
      readyForRegistration,
      readinessPercentage,
      dataQualityScore: avgCompleteness,
      totalCharts: charts.length,
    },
    uploads: uploads.map((u) => ({
      _id: u._id,
      originalName: u.originalName,
      rowCount: u.rowCount,
      typeName: u.typeId?.name || u.directionSnapshot?.typeName || "",
      programName: u.programId?.name || u.directionSnapshot?.programName || "",
      batchName: u.batchId?.name || u.directionSnapshot?.batchName || "",
      createdAt: u.createdAt,
    })),
    preview: {
      columns,
      rowCount: totalRows,
      columnCount: columns.length,
      sampleRows: allRows.slice(0, 10).map((row) => {
        const cleaned = {};
        columns.forEach((col) => {
          cleaned[col] = row[col] ?? "";
        });
        return cleaned;
      }),
    },
    columnMeta,
    charts,
    pendingStats,
    locationStats: locationStats.slice(0, 15),
    mapPins,
    topFindings: topFindings.slice(0, 5),
  };
};

const getAnalytics = async (req, res) => {
  try {
    if (req.user.role !== "admin" && !req.user.permissions?.canView) {
      return res.status(403).json({
        message: "You do not have permission to view analytics.",
      });
    }

    const payload = await buildAnalyticsPayload(req);
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate analytics.",
      error: error.message,
    });
  }
};

const exportAnalyticsCsv = async (req, res) => {
  try {
    if (req.user.role !== "admin" && !req.user.permissions?.canView) {
      return res.status(403).json({
        message: "You do not have permission to export analytics.",
      });
    }

    const payload = await buildAnalyticsPayload(req);

    const summaryRows = [
      ["Metric", "Value"],
      ["Total Rows", payload.summary.totalRows],
      ["Total Uploads", payload.summary.totalUploads],
      ["Most Popular Program", payload.summary.mostPopularProgram],
      ["Top Sales Person", payload.summary.topSalesPerson],
      ["Top Location", payload.summary.topLocation],
      ["Dominant Qualification", payload.summary.dominantQualification],
      ["Ready For Registration", payload.summary.readyForRegistration],
      ["Readiness Percentage", payload.summary.readinessPercentage],
      ["Data Quality Score", payload.summary.dataQualityScore],
      ["Total Charts", payload.summary.totalCharts],
      ["Missing Service Letter", payload.pendingStats.missingServiceLetter],
      ["Missing A/L", payload.pendingStats.missingAL],
      ["Missing O/L", payload.pendingStats.missingOL],
      ["Mapped Location Pins", payload.mapPins?.length || 0],
    ];

    const findingRows = [
      [],
      ["Top Findings"],
      ...payload.topFindings.map((item) => [item]),
    ];

    const previewRows = [
      [],
      ["Preview Data"],
      payload.preview.columns,
      ...payload.preview.sampleRows.map((row) =>
        payload.preview.columns.map((col) => String(row[col] ?? ""))
      ),
    ];

    const allRows = [...summaryRows, ...findingRows, ...previewRows];

    const csv = allRows
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="user-analytics-summary.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      message: "Failed to export analytics CSV.",
      error: error.message,
    });
  }
};

module.exports = { getAnalytics, exportAnalyticsCsv };