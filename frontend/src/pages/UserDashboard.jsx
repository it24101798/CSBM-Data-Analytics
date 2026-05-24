import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import AnalyticsMap from "../components/AnalyticsMap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

const CHART_COLORS = [
  "#1d4ed8",
  "#0f766e",
  "#b45309",
  "#b91c1c",
  "#6d28d9",
  "#0369a1",
  "#15803d",
  "#c2410c",
  "#7c3aed",
  "#334155",
  "#0ea5e9",
  "#16a34a",
];

const EMPTY_FILTERS = {
  typeId: "",
  programId: "",
  batchId: "",
};

const EMPTY_UPLOAD_DIRECTION = {
  typeId: "",
  programId: "",
  batchId: "",
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const reportRef = useRef(null);

  const [isCompact, setIsCompact] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1260 : false
  );

  const [types, setTypes] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [uploadPrograms, setUploadPrograms] = useState([]);
  const [uploadBatches, setUploadBatches] = useState([]);

  const [filterPrograms, setFilterPrograms] = useState([]);
  const [filterBatches, setFilterBatches] = useState([]);

  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [replaceMode, setReplaceMode] = useState(false);

  const [uploadDirection, setUploadDirection] = useState(EMPTY_UPLOAD_DIRECTION);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [uploadTypeCode, setUploadTypeCode] = useState("");
  const [filterTypeCode, setFilterTypeCode] = useState("");

  const [expandedTypes, setExpandedTypes] = useState({});
  const [expandedPrograms, setExpandedPrograms] = useState({});

  const permissions = user?.permissions || {};
  const canUpload = !!permissions.canUpload;
  const canDelete = !!permissions.canDelete;
  const canView = !!permissions.canView;

  const hasAnalyticsData = !!analytics?.summary;
  const previewColumns = analytics?.preview?.columns || [];
  const previewRows = analytics?.preview?.sampleRows || [];
  const columnMeta = analytics?.columnMeta || [];
  const backendCharts = analytics?.charts || [];
  const uploadList = analytics?.uploads || uploads || [];
  const topFindings = analytics?.topFindings || [];
  const locationStats = analytics?.locationStats || [];
  const mapPins = analytics?.mapPins || [];
  const pendingStats = analytics?.pendingStats || {};
  const summary = analytics?.summary || {};

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 1260);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const safeAlert = (message) => window.alert(message);

  const getTypeCode = (typeId) => {
    const selectedType = types.find((item) => item._id === typeId);
    return selectedType?.code || "";
  };

  const getTypeName = (typeId) => {
    const selectedType = types.find((item) => item._id === typeId);
    return selectedType?.name || "";
  };

  const fetchTypes = async () => {
    const res = await axiosInstance.get("/api/directions/types");
    const data = Array.isArray(res.data) ? res.data : [];
    setTypes(data);
    return data;
  };

  const fetchProgramsForType = async (typeId) => {
    if (!typeId) return [];
    const res = await axiosInstance.get(`/api/directions/programs?typeId=${typeId}`);
    return Array.isArray(res.data) ? res.data : [];
  };

  const fetchBatchesForType = async (typeId, programId, typeCode) => {
    if (!typeId) return [];

    let url = `/api/directions/batches?typeId=${typeId}`;

    if (typeCode === "NEW_REGISTRATION") {
      url += "&programId=none";
    } else if (programId) {
      url += `&programId=${programId}`;
    }

    const res = await axiosInstance.get(url);
    return Array.isArray(res.data) ? res.data : [];
  };

  const fetchUploads = async () => {
    const res = await axiosInstance.get("/api/uploads/my");
    setUploads(Array.isArray(res.data) ? res.data : []);
  };

  const fetchAnalytics = async (customFilters = filters) => {
    const params = new URLSearchParams();

    if (customFilters.typeId) params.append("typeId", customFilters.typeId);
    if (customFilters.programId) params.append("programId", customFilters.programId);
    if (customFilters.batchId) params.append("batchId", customFilters.batchId);

    const query = params.toString();
    const res = await axiosInstance.get(`/api/analytics${query ? `?${query}` : ""}`);
    setAnalytics(res.data || null);
    return res.data;
  };

  const initializeDashboard = async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      await fetchTypes();
      await fetchUploads();

      if (canView) {
        await fetchAnalytics(EMPTY_FILTERS);
      }
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initializeDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const handleUploadTypeChange = async (typeId) => {
    const code = getTypeCode(typeId);

    setUploadTypeCode(code);
    setUploadDirection({
      typeId,
      programId: "",
      batchId: "",
    });

    setUploadPrograms([]);
    setUploadBatches([]);

    if (!typeId) return;

    try {
      if (code === "NEW_REGISTRATION") {
        const batches = await fetchBatchesForType(typeId, "", code);
        setUploadBatches(batches);
      } else {
        const programs = await fetchProgramsForType(typeId);
        setUploadPrograms(programs);
      }
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to load upload directions");
    }
  };

  const handleUploadProgramChange = async (programId) => {
    const nextDirection = {
      ...uploadDirection,
      programId,
      batchId: "",
    };
    setUploadDirection(nextDirection);
    setUploadBatches([]);

    if (!programId || !uploadDirection.typeId) return;

    try {
      const batches = await fetchBatchesForType(
        uploadDirection.typeId,
        programId,
        uploadTypeCode
      );
      setUploadBatches(batches);
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to load upload batches");
    }
  };

  const handleFilterTypeChange = async (typeId) => {
    const code = getTypeCode(typeId);

    setFilterTypeCode(code);
    setFilters({
      typeId,
      programId: "",
      batchId: "",
    });

    setFilterPrograms([]);
    setFilterBatches([]);

    if (!typeId) return;

    try {
      if (code === "NEW_REGISTRATION") {
        const batches = await fetchBatchesForType(typeId, "", code);
        setFilterBatches(batches);
      } else {
        const programs = await fetchProgramsForType(typeId);
        setFilterPrograms(programs);
      }
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to load analysis filters");
    }
  };

  const handleFilterProgramChange = async (programId) => {
    const nextFilters = {
      ...filters,
      programId,
      batchId: "",
    };

    setFilters(nextFilters);
    setFilterBatches([]);

    if (!programId || !filters.typeId) return;

    try {
      const batches = await fetchBatchesForType(filters.typeId, programId, filterTypeCode);
      setFilterBatches(batches);
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to load filtered batches");
    }
  };

  const uploadToEndpoint = async (endpoint) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("typeId", uploadDirection.typeId);
    formData.append("batchId", uploadDirection.batchId);

    if (uploadTypeCode !== "NEW_REGISTRATION") {
      formData.append("programId", uploadDirection.programId);
    }

    await axiosInstance.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!canUpload) {
      safeAlert("You do not have upload permission.");
      return;
    }

    if (!file) {
      safeAlert("Please select a file first.");
      return;
    }

    if (!uploadDirection.typeId || !uploadDirection.batchId) {
      safeAlert("Please select the required direction fields.");
      return;
    }

    if (uploadTypeCode !== "NEW_REGISTRATION" && !uploadDirection.programId) {
      safeAlert("Please select Program / Group.");
      return;
    }

    try {
      setUploading(true);

      await uploadToEndpoint(replaceMode ? "/api/uploads/replace" : "/api/uploads");

      await fetchUploads();
      if (canView) {
        await fetchAnalytics(filters);
      }

      setFile(null);
      setUploadDirection(EMPTY_UPLOAD_DIRECTION);
      setUploadTypeCode("");
      setUploadPrograms([]);
      setUploadBatches([]);
      setActiveTab("preview");

      safeAlert(
        replaceMode
          ? "Existing upload replaced successfully."
          : "File uploaded and parsed successfully."
      );
    } catch (err) {
      safeAlert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!canView) {
      safeAlert("You do not have view permission.");
      return;
    }

    try {
      setAnalyzing(true);
      await fetchAnalytics(filters);
      setActiveTab("overview");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResetFilters = async () => {
    try {
      setFilters(EMPTY_FILTERS);
      setFilterTypeCode("");
      setFilterPrograms([]);
      setFilterBatches([]);

      if (canView) {
        await fetchAnalytics(EMPTY_FILTERS);
      }

      setActiveTab("overview");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to reset filters");
    }
  };

  const handleDeleteUpload = async (id) => {
    if (!canDelete) {
      safeAlert("You do not have delete permission.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this upload?");
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/api/uploads/${id}`);
      await fetchUploads();

      if (canView) {
        await fetchAnalytics(filters);
      }

      safeAlert("Upload deleted successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleTreeSelect = async (node) => {
    const nextFilters = {
      typeId: node.typeId || "",
      programId: node.programId || "",
      batchId: node.batchId || "",
    };

    setFilters(nextFilters);

    if (node.typeId) {
      setExpandedTypes((prev) => ({ ...prev, [node.typeId]: true }));
    }

    if (node.programId) {
      const key = `${node.typeId}_${node.programId}`;
      setExpandedPrograms((prev) => ({ ...prev, [key]: true }));
    }

    const typeCode = getTypeCode(nextFilters.typeId);
    setFilterTypeCode(typeCode);

    try {
      if (nextFilters.typeId) {
        if (typeCode === "NEW_REGISTRATION") {
          const months = await fetchBatchesForType(nextFilters.typeId, "", typeCode);
          setFilterPrograms([]);
          setFilterBatches(months);
        } else {
          const programsData = await fetchProgramsForType(nextFilters.typeId);
          setFilterPrograms(programsData);

          if (nextFilters.programId) {
            const batchesData = await fetchBatchesForType(
              nextFilters.typeId,
              nextFilters.programId,
              typeCode
            );
            setFilterBatches(batchesData);
          } else {
            setFilterBatches([]);
          }
        }
      } else {
        setFilterPrograms([]);
        setFilterBatches([]);
      }

      if (canView) {
        setAnalyzing(true);
        await fetchAnalytics(nextFilters);
        setActiveTab("overview");
      }
    } catch (err) {
      safeAlert(err.response?.data?.message || "Tree analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleTypeExpand = (typeId) => {
    setExpandedTypes((prev) => ({
      ...prev,
      [typeId]: !prev[typeId],
    }));
  };

  const toggleProgramExpand = (typeId, programId) => {
    const key = `${typeId}_${programId}`;
    setExpandedPrograms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const exportAnalyticsCsv = async () => {
    try {
      const params = new URLSearchParams();

      if (filters.typeId) params.append("typeId", filters.typeId);
      if (filters.programId) params.append("programId", filters.programId);
      if (filters.batchId) params.append("batchId", filters.batchId);

      const query = params.toString();
      const response = await axiosInstance.get(
        `/api/analytics/export-csv${query ? `?${query}` : ""}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "user-analytics-summary.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      safeAlert(err.response?.data?.message || "CSV export failed");
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!hasAnalyticsData) {
        safeAlert("No analytics data available for PDF export.");
        return;
      }

      const element = reportRef.current;
      if (!element) {
        safeAlert("No report content found.");
        return;
      }

      setExportingPdf(true);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("CSBM Smart Analytics Report", margin, 10);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Scope: ${currentFilterLabel}`, margin, 16);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 21);

      pdf.addImage(imgData, "PNG", margin, 26, usableWidth, imgHeight);
      heightLeft -= pageHeight - 26 - margin;

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + margin;
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save("CSBM_Analytics_Report.pdf");
    } catch (err) {
      console.error(err);
      safeAlert("Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const summaryCards = useMemo(() => {
    if (!analytics?.summary) return [];

    return [
      { label: "Total Records", value: summary.totalRows ?? 0, tone: "primary" },
      { label: "Total Uploads", value: summary.totalUploads ?? 0, tone: "dark" },
      {
        label: "Readiness %",
        value: `${summary.readinessPercentage ?? 0}%`,
        tone: "cool",
      },
      {
        label: "Data Quality",
        value: `${summary.dataQualityScore ?? 0}%`,
        tone: "cool",
      },
      {
        label: "Charts Generated",
        value: summary.totalCharts ?? 0,
        tone: "light",
      },
      {
        label: "Top Program",
        value: summary.mostPopularProgram || "Not available",
        tone: "light",
      },
      {
        label: "Top Sales Person",
        value: summary.topSalesPerson || "Not available",
        tone: "light",
      },
      {
        label: "Top Area",
        value: summary.topLocation || "Not available",
        tone: "light",
      },
      {
        label: "Top Qualification",
        value: summary.dominantQualification || "Not available",
        tone: "light",
      },
      {
        label: "Missing Service Letters",
        value: pendingStats.missingServiceLetter ?? 0,
        tone: "warn",
      },
      {
        label: "Missing A/L",
        value: pendingStats.missingAL ?? 0,
        tone: "warn",
      },
      {
        label: "Missing O/L",
        value: pendingStats.missingOL ?? 0,
        tone: "warn",
      },
    ];
  }, [analytics, summary, pendingStats]);

  const strongestColumns = useMemo(() => {
    return [...columnMeta].sort((a, b) => b.completeness - a.completeness).slice(0, 6);
  }, [columnMeta]);

  const businessInsights = useMemo(() => {
    if (Array.isArray(topFindings) && topFindings.length) return topFindings;
    return [];
  }, [topFindings]);

  const analysisTree = useMemo(() => {
    if (!types.length) return [];

    const grouped = {};

    uploads.forEach((upload) => {
      const typeId = upload.typeId?._id || "";
      const typeName = upload.typeName || upload.typeId?.name || "";
      const typeCode = upload.typeId?.code || getTypeCode(typeId) || "";
      const programId = upload.programId?._id || "";
      const programName = upload.programName || upload.programId?.name || "";
      const batchId = upload.batchId?._id || "";
      const batchName = upload.batchName || upload.batchId?.name || "";

      if (!typeId) return;

      if (!grouped[typeId]) {
        grouped[typeId] = {
          typeId,
          typeName,
          typeCode,
          programs: {},
          months: {},
        };
      }

      if (typeCode === "NEW_REGISTRATION") {
        if (batchId && !grouped[typeId].months[batchId]) {
          grouped[typeId].months[batchId] = {
            batchId,
            batchName,
          };
        }
      } else {
        if (programId) {
          if (!grouped[typeId].programs[programId]) {
            grouped[typeId].programs[programId] = {
              programId,
              programName,
              batches: {},
            };
          }

          if (batchId) {
            grouped[typeId].programs[programId].batches[batchId] = {
              batchId,
              batchName,
            };
          }
        }
      }
    });

    return Object.values(grouped).map((typeNode) => ({
      ...typeNode,
      programs: Object.values(typeNode.programs).map((programNode) => ({
        ...programNode,
        batches: Object.values(programNode.batches),
      })),
      months: Object.values(typeNode.months),
    }));
  }, [uploads, types]);

  useEffect(() => {
    const nextExpandedTypes = {};
    const nextExpandedPrograms = {};

    analysisTree.forEach((typeNode) => {
      if (filters.typeId && filters.typeId === typeNode.typeId) {
        nextExpandedTypes[typeNode.typeId] = true;
      }

      typeNode.programs.forEach((programNode) => {
        if (
          filters.typeId === typeNode.typeId &&
          filters.programId === programNode.programId
        ) {
          nextExpandedTypes[typeNode.typeId] = true;
          nextExpandedPrograms[`${typeNode.typeId}_${programNode.programId}`] = true;
        }
      });
    });

    if (Object.keys(nextExpandedTypes).length) {
      setExpandedTypes((prev) => ({ ...prev, ...nextExpandedTypes }));
    }
    if (Object.keys(nextExpandedPrograms).length) {
      setExpandedPrograms((prev) => ({ ...prev, ...nextExpandedPrograms }));
    }
  }, [analysisTree, filters]);

  const breadcrumbItems = useMemo(() => {
    const items = ["Analysis"];

    if (!filters.typeId) return items;

    const typeNode = analysisTree.find((item) => item.typeId === filters.typeId);
    if (!typeNode) return items;

    items.push(typeNode.typeName);

    if (typeNode.typeCode === "NEW_REGISTRATION") {
      if (filters.batchId) {
        const monthNode = typeNode.months.find((item) => item.batchId === filters.batchId);
        if (monthNode) items.push(monthNode.batchName);
      }
      return items;
    }

    if (filters.programId) {
      const programNode = typeNode.programs.find(
        (item) => item.programId === filters.programId
      );
      if (programNode) {
        items.push(programNode.programName);

        if (filters.batchId) {
          const batchNode = programNode.batches.find(
            (item) => item.batchId === filters.batchId
          );
          if (batchNode) items.push(batchNode.batchName);
        }
      }
    }

    return items;
  }, [filters, analysisTree]);

  const currentFilterLabel = useMemo(() => {
    if (!filters.typeId) return "All uploaded data";

    const typeName = getTypeName(filters.typeId);

    if (filters.batchId && filterBatches.length > 0) {
      const batch = filterBatches.find((item) => item._id === filters.batchId);
      if (batch) return `${typeName} / ${batch.name}`;
    }

    if (filters.programId && filterPrograms.length > 0) {
      const program = filterPrograms.find((item) => item._id === filters.programId);
      if (program) return `${typeName} / ${program.name}`;
    }

    return typeName || "Filtered data";
  }, [filters, filterPrograms, filterBatches, types]);

  const isTypeActive = (typeId) =>
    filters.typeId === typeId && !filters.programId && !filters.batchId;

  const isProgramActive = (typeId, programId) =>
    filters.typeId === typeId && filters.programId === programId && !filters.batchId;

  const isBatchActive = (typeId, programId, batchId) =>
    filters.typeId === typeId &&
    (programId ? filters.programId === programId : true) &&
    filters.batchId === batchId;

  const toSafeChartArray = (data) => {
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => ({
        name: String(item?.name ?? item?.label ?? "Unknown"),
        value: Number(item?.value ?? item?.count ?? item?.total ?? 0),
      }))
      .filter((item) => !Number.isNaN(item.value));
  };

  const normalizedBackendCharts = useMemo(() => {
    return backendCharts
      .map((chart, index) => {
        const normalizedData = toSafeChartArray(chart?.data);
        if (!normalizedData.length) return null;

        let chartType = String(chart?.chartType || "").toLowerCase();
        const title = chart?.title || `Chart ${index + 1}`;
        const column = chart?.column || "Detected data";

        if (!["bar", "pie", "line", "area", "column"].includes(chartType)) {
          chartType = "bar";
        }

        if (chartType === "bar") chartType = "column";

        return {
          key: chart?.key || `backend-chart-${index}`,
          title,
          column,
          chartType,
          data: normalizedData,
        };
      })
      .filter(Boolean);
  }, [backendCharts]);

  const advancedCharts = useMemo(() => {
    const list = [];

    if (locationStats.length) {
      list.push({
        key: "top-student-locations",
        title: "Top Student Locations",
        column: "address / city / district",
        chartType: "bar",
        data: toSafeChartArray(locationStats).slice(0, 8),
      });
    }

    const documentCompletionData = [
      { name: "Service Letter Missing", value: Number(pendingStats.missingServiceLetter || 0) },
      { name: "A/L Missing", value: Number(pendingStats.missingAL || 0) },
      { name: "O/L Missing", value: Number(pendingStats.missingOL || 0) },
    ].filter((item) => item.value > 0);

    if (documentCompletionData.length) {
      list.push({
        key: "document-completion-status",
        title: "Document Completion Status",
        column: "service letter / A/L / O/L",
        chartType: "pie",
        data: documentCompletionData,
      });
    }

    const readinessData = [
      { name: "Readiness %", value: Number(summary.readinessPercentage || 0) },
      {
        name: "Remaining %",
        value: Math.max(0, 100 - Number(summary.readinessPercentage || 0)),
      },
    ];

    if (summary.readinessPercentage !== undefined) {
      list.push({
        key: "registration-readiness",
        title: "Registration Readiness",
        column: "readiness percentage",
        chartType: "pie",
        data: readinessData,
      });
    }

    const qualityTrendData = [
      { name: "Readiness", value: Number(summary.readinessPercentage || 0) },
      { name: "Data Quality", value: Number(summary.dataQualityScore || 0) },
    ];

    if (qualityTrendData.some((item) => item.value > 0)) {
      list.push({
        key: "readiness-vs-quality",
        title: "Readiness vs Data Quality",
        column: "summary metrics",
        chartType: "line",
        data: qualityTrendData,
      });
    }

    const countCardsData = [
      { name: "Records", value: Number(summary.totalRows || 0) },
      { name: "Uploads", value: Number(summary.totalUploads || 0) },
      { name: "Charts", value: Number(summary.totalCharts || 0) },
    ].filter((item) => item.value > 0);

    if (countCardsData.length) {
      list.push({
        key: "dataset-scale-overview",
        title: "Dataset Scale Overview",
        column: "summary totals",
        chartType: "area",
        data: countCardsData,
      });
    }

    return list;
  }, [locationStats, pendingStats, summary]);

  const finalCharts = useMemo(() => {
    const merged = [...normalizedBackendCharts];
    const existingKeys = new Set(merged.map((item) => item.key));

    advancedCharts.forEach((chart) => {
      if (!existingKeys.has(chart.key)) {
        merged.push(chart);
      }
    });

    return merged;
  }, [normalizedBackendCharts, advancedCharts]);

  const renderChart = (chart) => {
    if (!chart?.data?.length) {
      return <p style={styles.muted}>No chart data available.</p>;
    }

    if (chart.chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={chart.data} dataKey="value" nameKey="name" outerRadius={104} label>
              {chart.data.map((entry, index) => (
                <Cell
                  key={`${chart.key}-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-12}
              textAnchor="end"
              interval={0}
              height={74}
              tick={{ fontSize: 11 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1d4ed8"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-12}
              textAnchor="end"
              interval={0}
              height={74}
              tick={{ fontSize: 11 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1d4ed8"
              fill="#93c5fd"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-16}
            textAnchor="end"
            interval={0}
            height={78}
            tick={{ fontSize: 11 }}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#1d4ed8" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingBadge}>Analytics Workspace</div>
          <h2 style={styles.loadingTitle}>Loading dashboard...</h2>
          <p style={styles.muted}>Preparing directions, uploads, and analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageGlowOne} />
      <div style={styles.pageGlowTwo} />

      <header style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <div style={styles.topKicker}>Analytics Workspace</div>
          <h1 style={styles.brand}>CSBM Smart Analytics Engine</h1>
          <p style={styles.brandSub}>
            A premium workspace for structured file intelligence, preview, hierarchy-based
            analysis, and decision-ready charts.
          </p>
        </div>

        <div style={styles.topBarActions}>
          <button
            style={styles.ghostBtn}
            onClick={() => initializeDashboard({ silent: true })}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <div style={styles.userBadge}>
            <div style={styles.userName}>{user?.name || "User"}</div>
            <div style={styles.userRole}>{user?.role || "user"}</div>
          </div>

          <button style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section style={styles.heroStrip}>
        <div style={styles.heroTextWrap}>
          <div style={styles.heroBadge}>Structured Direction Analytics</div>
          <h2 style={styles.heroTitle}>
            Move from uploads to insight with stronger charts and cleaner analysis flow
          </h2>
          <p style={styles.heroText}>
            Use the analysis navigator to drill into Type, Program, or Batch-level insight.
            Then review extracted rows, quick findings, named charts, map intelligence,
            and downloadable reports in one premium dashboard.
          </p>

          <div style={styles.heroMetricRow}>
            <div style={styles.heroMetricCard}>
              <div style={styles.heroMetricLabel}>Current Scope</div>
              <div style={styles.heroMetricValue}>{currentFilterLabel}</div>
            </div>
            <div style={styles.heroMetricCard}>
              <div style={styles.heroMetricLabel}>View Access</div>
              <div style={styles.heroMetricValue}>{canView ? "Enabled" : "Disabled"}</div>
            </div>
            <div style={styles.heroMetricCard}>
              <div style={styles.heroMetricLabel}>Upload Access</div>
              <div style={styles.heroMetricValue}>{canUpload ? "Enabled" : "Disabled"}</div>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.permissionsRow}>
        <div style={styles.permissionCard}>
          <div style={styles.permissionIconBlue}>V</div>
          <div>
            <div style={styles.permissionTitle}>View Analytics</div>
            <div style={styles.permissionValue}>{canView ? "Allowed" : "Not Allowed"}</div>
          </div>
        </div>

        <div style={styles.permissionCard}>
          <div style={styles.permissionIconTeal}>U</div>
          <div>
            <div style={styles.permissionTitle}>Upload Files</div>
            <div style={styles.permissionValue}>{canUpload ? "Allowed" : "Not Allowed"}</div>
          </div>
        </div>

        <div style={styles.permissionCard}>
          <div style={styles.permissionIconRed}>D</div>
          <div>
            <div style={styles.permissionTitle}>Delete Files</div>
            <div style={styles.permissionValue}>{canDelete ? "Allowed" : "Not Allowed"}</div>
          </div>
        </div>
      </section>

      <main style={styles.content}>
        <section
          style={{
            ...styles.mainShell,
            gridTemplateColumns: isCompact ? "1fr" : "320px minmax(0, 1fr) 320px",
          }}
        >
          <aside
            style={{
              ...styles.sidePanel,
              position: isCompact ? "relative" : "sticky",
              top: isCompact ? "auto" : "100px",
            }}
          >
            <div style={styles.panelHead}>
              <div style={styles.panelTag}>Navigator</div>
              <h3 style={styles.panelTitle}>Hierarchy Explorer</h3>
              <p style={styles.panelText}>
                Select a type, program, or batch node to focus the analysis instantly.
              </p>
            </div>

            <button
              style={{
                ...styles.navigatorRootBtn,
                ...(!filters.typeId && !filters.programId && !filters.batchId
                  ? styles.navigatorRootBtnActive
                  : {}),
              }}
              onClick={() => handleTreeSelect(EMPTY_FILTERS)}
            >
              Analyze All Data
            </button>

            <div style={styles.treeWrap}>
              {analysisTree.length === 0 ? (
                <p style={styles.muted}>No uploaded directions found yet.</p>
              ) : (
                analysisTree.map((typeNode) => {
                  const typeExpanded = !!expandedTypes[typeNode.typeId];

                  return (
                    <div key={typeNode.typeId} style={styles.treeSection}>
                      <div style={styles.treeTopRow}>
                        <button
                          style={{
                            ...styles.treeRoot,
                            ...(isTypeActive(typeNode.typeId) ? styles.treeRootActive : {}),
                          }}
                          onClick={() =>
                            handleTreeSelect({
                              typeId: typeNode.typeId,
                              programId: "",
                              batchId: "",
                            })
                          }
                        >
                          {typeNode.typeName}
                        </button>

                        <button
                          type="button"
                          style={styles.expandBtn}
                          onClick={() => toggleTypeExpand(typeNode.typeId)}
                        >
                          {typeExpanded ? "−" : "+"}
                        </button>
                      </div>

                      {typeExpanded && (
                        <>
                          {typeNode.typeCode === "NEW_REGISTRATION" ? (
                            <div style={styles.treeChildren}>
                              {typeNode.months.map((monthNode) => (
                                <button
                                  key={monthNode.batchId}
                                  style={{
                                    ...styles.treeLeaf,
                                    ...(isBatchActive(typeNode.typeId, "", monthNode.batchId)
                                      ? styles.treeLeafActive
                                      : {}),
                                  }}
                                  onClick={() =>
                                    handleTreeSelect({
                                      typeId: typeNode.typeId,
                                      programId: "",
                                      batchId: monthNode.batchId,
                                    })
                                  }
                                >
                                  {monthNode.batchName}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div style={styles.treeChildren}>
                              {typeNode.programs.map((programNode) => {
                                const programKey = `${typeNode.typeId}_${programNode.programId}`;
                                const programExpanded = !!expandedPrograms[programKey];

                                return (
                                  <div key={programNode.programId} style={styles.treeProgramBlock}>
                                    <div style={styles.treeTopRow}>
                                      <button
                                        style={{
                                          ...styles.treeProgram,
                                          ...(isProgramActive(
                                            typeNode.typeId,
                                            programNode.programId
                                          )
                                            ? styles.treeProgramActive
                                            : {}),
                                        }}
                                        onClick={() =>
                                          handleTreeSelect({
                                            typeId: typeNode.typeId,
                                            programId: programNode.programId,
                                            batchId: "",
                                          })
                                        }
                                      >
                                        {programNode.programName}
                                      </button>

                                      <button
                                        type="button"
                                        style={styles.expandBtnSmall}
                                        onClick={() =>
                                          toggleProgramExpand(
                                            typeNode.typeId,
                                            programNode.programId
                                          )
                                        }
                                      >
                                        {programExpanded ? "−" : "+"}
                                      </button>
                                    </div>

                                    {programExpanded && (
                                      <div style={styles.treeGrandChildren}>
                                        {programNode.batches.map((batchNode) => (
                                          <button
                                            key={batchNode.batchId}
                                            style={{
                                              ...styles.treeLeaf,
                                              ...(isBatchActive(
                                                typeNode.typeId,
                                                programNode.programId,
                                                batchNode.batchId
                                              )
                                                ? styles.treeLeafActive
                                                : {}),
                                            }}
                                            onClick={() =>
                                              handleTreeSelect({
                                                typeId: typeNode.typeId,
                                                programId: programNode.programId,
                                                batchId: batchNode.batchId,
                                              })
                                            }
                                          >
                                            {batchNode.batchName}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <section style={styles.centerPanel}>
            <section style={styles.cardPremium}>
              <div style={styles.sectionHeader}>
                <div>
                  <div style={styles.smallTag}>Upload</div>
                  <h3 style={styles.sectionTitle}>Upload by Direction</h3>
                  <p style={styles.sectionSub}>
                    Choose the correct hierarchy path and upload or replace a file for that exact
                    node.
                  </p>
                </div>
              </div>

              {!canUpload ? (
                <div style={styles.permissionBlock}>
                  You do not currently have upload permission from the admin.
                </div>
              ) : (
                <form onSubmit={handleUpload} style={styles.formWrap}>
                  <div style={styles.switchRow}>
                    <button
                      type="button"
                      style={!replaceMode ? styles.modeBtnActive : styles.modeBtn}
                      onClick={() => setReplaceMode(false)}
                    >
                      New Upload
                    </button>

                    <button
                      type="button"
                      style={replaceMode ? styles.modeBtnActiveWarn : styles.modeBtn}
                      onClick={() => setReplaceMode(true)}
                    >
                      Replace Existing Upload
                    </button>
                  </div>

                  {replaceMode && (
                    <div style={styles.noteWarn}>
                      Replace mode overwrites the current upload for the same Type / Program /
                      Batch.
                    </div>
                  )}

                  <div style={styles.grid3}>
                    <div>
                      <label style={styles.label}>Type</label>
                      <select
                        style={styles.input}
                        value={uploadDirection.typeId}
                        onChange={(e) => handleUploadTypeChange(e.target.value)}
                      >
                        <option value="">Select Type</option>
                        {types.map((type) => (
                          <option key={type._id} value={type._id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {uploadTypeCode !== "NEW_REGISTRATION" && (
                      <div>
                        <label style={styles.label}>Program / Group</label>
                        <select
                          style={styles.input}
                          value={uploadDirection.programId}
                          onChange={(e) => handleUploadProgramChange(e.target.value)}
                        >
                          <option value="">Select Program / Group</option>
                          {uploadPrograms.map((program) => (
                            <option key={program._id} value={program._id}>
                              {program.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label style={styles.label}>
                        {uploadTypeCode === "NEW_REGISTRATION" ? "Month" : "Batch / Month"}
                      </label>
                      <select
                        style={styles.input}
                        value={uploadDirection.batchId}
                        onChange={(e) =>
                          setUploadDirection((prev) => ({ ...prev, batchId: e.target.value }))
                        }
                      >
                        <option value="">
                          {uploadTypeCode === "NEW_REGISTRATION"
                            ? "Select Month"
                            : "Select Batch / Month"}
                        </option>
                        {uploadBatches.map((batch) => (
                          <option key={batch._id} value={batch._id}>
                            {batch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={styles.uploadRow}>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      style={styles.fileInput}
                    />

                    <button type="submit" style={styles.primaryBtn} disabled={uploading}>
                      {uploading
                        ? replaceMode
                          ? "Replacing..."
                          : "Uploading..."
                        : replaceMode
                        ? "Replace Upload"
                        : "Upload File"}
                    </button>
                  </div>

                  {file && (
                    <div style={styles.filePreviewBox}>
                      Selected file: <strong>{file.name}</strong>
                    </div>
                  )}

                  <div style={styles.noteBox}>
                    Supported formats: <strong>.xlsx</strong>, <strong>.xls</strong>, and{" "}
                    <strong>.csv</strong>.
                  </div>
                </form>
              )}
            </section>

            <section style={styles.cardPremium}>
              <div style={styles.sectionHeader}>
                <div>
                  <div style={styles.smallTag}>Scope</div>
                  <h3 style={styles.sectionTitle}>Analysis Scope</h3>
                  <p style={styles.sectionSub}>
                    Current scope: <strong>{currentFilterLabel}</strong>
                  </p>
                </div>
              </div>

              <div style={styles.breadcrumbWrap}>
                {breadcrumbItems.map((item, index) => (
                  <div key={`${item}-${index}`} style={styles.breadcrumbItem}>
                    <span>{item}</span>
                    {index < breadcrumbItems.length - 1 && (
                      <span style={styles.breadcrumbDivider}>/</span>
                    )}
                  </div>
                ))}
              </div>

              {!canView ? (
                <div style={styles.permissionBlock}>
                  You do not currently have permission to view analytics.
                </div>
              ) : (
                <>
                  <div style={styles.grid3}>
                    <div>
                      <label style={styles.label}>Type</label>
                      <select
                        style={styles.input}
                        value={filters.typeId}
                        onChange={(e) => handleFilterTypeChange(e.target.value)}
                      >
                        <option value="">All Types</option>
                        {types.map((type) => (
                          <option key={type._id} value={type._id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {filterTypeCode !== "NEW_REGISTRATION" && (
                      <div>
                        <label style={styles.label}>Program / Group</label>
                        <select
                          style={styles.input}
                          value={filters.programId}
                          onChange={(e) => handleFilterProgramChange(e.target.value)}
                        >
                          <option value="">All Programs / Groups</option>
                          {filterPrograms.map((program) => (
                            <option key={program._id} value={program._id}>
                              {program.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label style={styles.label}>
                        {filterTypeCode === "NEW_REGISTRATION" ? "Month" : "Batch / Month"}
                      </label>
                      <select
                        style={styles.input}
                        value={filters.batchId}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, batchId: e.target.value }))
                        }
                      >
                        <option value="">
                          {filterTypeCode === "NEW_REGISTRATION"
                            ? "All Months"
                            : "All Batches / Months"}
                        </option>
                        {filterBatches.map((batch) => (
                          <option key={batch._id} value={batch._id}>
                            {batch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={styles.actionRow}>
                    <button style={styles.primaryBtn} onClick={handleAnalyze} disabled={analyzing}>
                      {analyzing ? "Analyzing..." : "Analyze"}
                    </button>
                    <button style={styles.secondaryBtn} onClick={handleResetFilters}>
                      Reset Filters
                    </button>
                    <button style={styles.secondaryBtn} onClick={exportAnalyticsCsv}>
                      Export CSV
                    </button>
                    <button
                      style={styles.secondaryBtn}
                      onClick={handleExportPDF}
                      disabled={!hasAnalyticsData || exportingPdf}
                    >
                      {exportingPdf ? "Exporting PDF..." : "Export PDF"}
                    </button>
                  </div>
                </>
              )}
            </section>

            <div ref={reportRef} style={styles.reportArea}>
              <section style={styles.reportHeaderCard}>
                <div style={styles.reportHeaderTop}>
                  <div>
                    <div style={styles.smallTag}>Report</div>
                    <h3 style={styles.sectionTitle}>CSBM Smart Analytics Report</h3>
                    <p style={styles.sectionSub}>
                      Scope: <strong>{currentFilterLabel}</strong>
                    </p>
                  </div>

                  <div style={styles.reportMetaBox}>
                    <div>
                      <strong>Generated:</strong>
                    </div>
                    <div>{new Date().toLocaleString()}</div>
                  </div>
                </div>
              </section>

              <section style={styles.tabBar}>
                {[
                  { key: "overview", label: "Overview" },
                  { key: "preview", label: "Data Preview" },
                  { key: "columns", label: "Column Intelligence" },
                  { key: "charts", label: "Named Charts" },
                  { key: "uploads", label: "Upload History" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={activeTab === tab.key ? styles.activeTabBtn : styles.tabBtn}
                  >
                    {tab.label}
                  </button>
                ))}
              </section>

              {!hasAnalyticsData && canView && (
                <section style={styles.cardPremium}>
                  <h3 style={styles.sectionTitle}>No analytics yet</h3>
                  <p style={styles.muted}>
                    Upload a file first, or adjust filters so the system has data to analyze.
                  </p>
                </section>
              )}

              {hasAnalyticsData && activeTab === "overview" && (
                <>
                  <section style={styles.cardPremium}>
                    <div style={styles.sectionHeader}>
                      <div>
                        <div style={styles.smallTag}>Summary</div>
                        <h3 style={styles.sectionTitle}>Analytics Summary</h3>
                        <p style={styles.sectionSub}>
                          Key metrics from the selected analysis scope.
                        </p>
                      </div>
                    </div>

                    <div style={styles.summaryGrid}>
                      {summaryCards.map((item, index) => (
                        <div
                          key={`${item.label}-${index}`}
                          style={{
                            ...styles.summaryCard,
                            ...(item.tone === "primary"
                              ? styles.summaryPrimary
                              : item.tone === "warn"
                              ? styles.summaryWarn
                              : item.tone === "dark"
                              ? styles.summaryDark
                              : item.tone === "cool"
                              ? styles.summaryCool
                              : styles.summaryNeutral),
                          }}
                        >
                          <div style={styles.summaryLabel}>{item.label}</div>
                          <div style={styles.summaryValue}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section style={styles.cardPremium}>
                    <div style={styles.sectionHeader}>
                      <div>
                        <div style={styles.smallTag}>Highlights</div>
                        <h3 style={styles.sectionTitle}>Business Insights</h3>
                        <p style={styles.sectionSub}>
                          Quick interpretation of the selected type, program, or batch.
                        </p>
                      </div>
                    </div>

                    <div style={styles.insightList}>
                      {businessInsights.length === 0 ? (
                        <p style={styles.muted}>No insights available yet.</p>
                      ) : (
                        businessInsights.map((item, index) => (
                          <div key={index} style={styles.insightCard}>
                            <div style={styles.insightDot} />
                            <div style={styles.insightText}>{item}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section style={styles.cardPremium}>
                    <div style={styles.sectionHeader}>
                      <div>
                        <div style={styles.smallTag}>Location Intelligence</div>
                        <h3 style={styles.sectionTitle}>Student Location Map</h3>
                        <p style={styles.sectionSub}>
                          Pinned locations based on normalized addresses extracted from your uploaded
                          data.
                        </p>
                      </div>
                    </div>

                    {mapPins.length > 0 ? (
                      <AnalyticsMap pins={mapPins} />
                    ) : (
                      <div style={styles.permissionBlock}>
                        No map locations are available for the current filter.
                      </div>
                    )}
                  </section>

                  <section style={styles.cardPremium}>
                    <div style={styles.sectionHeader}>
                      <div>
                        <div style={styles.smallTag}>Quality</div>
                        <h3 style={styles.sectionTitle}>Strongest Detected Columns</h3>
                        <p style={styles.sectionSub}>
                          Best-quality columns based on completeness in the current analysis.
                        </p>
                      </div>
                    </div>

                    <div style={styles.columnCardGrid}>
                      {strongestColumns.map((col) => (
                        <div key={col.name} style={styles.columnCard}>
                          <div style={styles.columnName}>{col.name}</div>
                          <div style={styles.columnMetaRow}>Role: {col.role}</div>
                          <div style={styles.columnMetaRow}>Type: {col.dataType}</div>
                          <div style={styles.columnMetaRow}>Completeness: {col.completeness}%</div>
                          <div style={styles.columnMetaRow}>Unique Values: {col.uniqueValues}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {hasAnalyticsData && activeTab === "preview" && (
                <section style={styles.cardPremium}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <div style={styles.smallTag}>Preview</div>
                      <h3 style={styles.sectionTitle}>Extracted Data Preview</h3>
                      <p style={styles.sectionSub}>
                        This is the first sample of what the system extracted from the uploaded
                        files.
                      </p>
                    </div>
                  </div>

                  <div style={styles.previewTopStats}>
                    <div style={styles.previewMiniCard}>
                      <strong>Rows Extracted</strong>
                      <div>{analytics.preview?.rowCount || 0}</div>
                    </div>
                    <div style={styles.previewMiniCard}>
                      <strong>Columns Detected</strong>
                      <div>{analytics.preview?.columnCount || 0}</div>
                    </div>
                    <div style={styles.previewMiniCard}>
                      <strong>Preview Rows</strong>
                      <div>{previewRows.length}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <div style={styles.label}>Detected Columns</div>
                    <div style={styles.chipWrap}>
                      {previewColumns.map((col) => (
                        <span key={col} style={styles.chip}>
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          {previewColumns.map((col) => (
                            <th key={col} style={styles.th}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.length === 0 ? (
                          <tr>
                            <td style={styles.td} colSpan={previewColumns.length || 1}>
                              No preview rows available.
                            </td>
                          </tr>
                        ) : (
                          previewRows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {previewColumns.map((col) => (
                                <td key={`${rowIndex}-${col}`} style={styles.td}>
                                  {String(row[col] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {hasAnalyticsData && activeTab === "columns" && (
                <section style={styles.cardPremium}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <div style={styles.smallTag}>Structure</div>
                      <h3 style={styles.sectionTitle}>Detected Column Intelligence</h3>
                      <p style={styles.sectionSub}>
                        The system identifies likely roles such as gender, address, sales person,
                        and date of birth.
                      </p>
                    </div>
                  </div>

                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Column</th>
                          <th style={styles.th}>Role</th>
                          <th style={styles.th}>Data Type</th>
                          <th style={styles.th}>Non Empty</th>
                          <th style={styles.th}>Missing</th>
                          <th style={styles.th}>Unique Values</th>
                          <th style={styles.th}>Completeness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {columnMeta.map((col) => (
                          <tr key={col.name}>
                            <td style={styles.td}>{col.name}</td>
                            <td style={styles.td}>{col.role}</td>
                            <td style={styles.td}>{col.dataType}</td>
                            <td style={styles.td}>{col.nonEmptyCount}</td>
                            <td style={styles.td}>{col.missingCount}</td>
                            <td style={styles.td}>{col.uniqueValues}</td>
                            <td style={styles.td}>{col.completeness}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {hasAnalyticsData && activeTab === "charts" && (
                <section style={styles.chartGrid}>
                  {finalCharts.length === 0 ? (
                    <div style={styles.cardPremium}>
                      <h3 style={styles.sectionTitle}>No charts available</h3>
                      <p style={styles.muted}>
                        The uploaded data may not yet contain enough recognizable columns.
                      </p>
                    </div>
                  ) : (
                    finalCharts.map((chart) => (
                      <div key={`${chart.key}-${chart.title}`} style={styles.chartCard}>
                        <div style={styles.chartHeader}>
                          <div>
                            <div style={styles.chartTitle}>{chart.title}</div>
                            <div style={styles.chartMeta}>
                              Based on detected column: {chart.column}
                            </div>
                          </div>
                          <span style={styles.chartTypeBadge}>
                            {String(chart.chartType).toUpperCase()}
                          </span>
                        </div>
                        {renderChart(chart)}
                      </div>
                    ))
                  )}
                </section>
              )}

              {activeTab === "uploads" && (
                <section style={styles.cardPremium}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <div style={styles.smallTag}>History</div>
                      <h3 style={styles.sectionTitle}>My Uploaded Files</h3>
                      <p style={styles.sectionSub}>
                        Track every uploaded file and manage deletions if your permissions allow.
                      </p>
                    </div>
                  </div>

                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Original Name</th>
                          <th style={styles.th}>Type</th>
                          <th style={styles.th}>Program / Group</th>
                          <th style={styles.th}>Batch / Month</th>
                          <th style={styles.th}>Rows</th>
                          <th style={styles.th}>Uploaded At</th>
                          <th style={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadList.length === 0 ? (
                          <tr>
                            <td style={styles.td} colSpan={7}>
                              No uploads found.
                            </td>
                          </tr>
                        ) : (
                          uploadList.map((item) => (
                            <tr key={item._id}>
                              <td style={styles.td}>{item.originalName}</td>
                              <td style={styles.td}>{item.typeName || item.typeId?.name || "N/A"}</td>
                              <td style={styles.td}>
                                {item.programName || item.programId?.name || "Not needed"}
                              </td>
                              <td style={styles.td}>
                                {item.batchName || item.batchId?.name || "N/A"}
                              </td>
                              <td style={styles.td}>{item.rowCount}</td>
                              <td style={styles.td}>
                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
                              </td>
                              <td style={styles.td}>
                                <button
                                  style={{
                                    ...styles.deleteBtn,
                                    opacity: canDelete ? 1 : 0.55,
                                    cursor: canDelete ? "pointer" : "not-allowed",
                                  }}
                                  disabled={!canDelete}
                                  onClick={() => handleDeleteUpload(item._id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          </section>

          {!isCompact && (
            <aside
              style={{
                ...styles.rightRail,
                position: "sticky",
                top: "100px",
              }}
            >
              <section style={styles.railCard}>
                <div style={styles.panelTag}>Current Path</div>
                <h3 style={styles.panelTitle}>Analysis Scope</h3>
                <p style={styles.panelText}>{currentFilterLabel}</p>

                <div style={styles.breadcrumbWrapRail}>
                  {breadcrumbItems.map((item, index) => (
                    <div key={`${item}-${index}`} style={styles.breadcrumbItemRail}>
                      <span>{item}</span>
                      {index < breadcrumbItems.length - 1 && (
                        <span style={styles.breadcrumbDivider}>/</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section style={styles.railCard}>
                <div style={styles.panelTag}>Top Findings</div>
                <h3 style={styles.panelTitle}>Quick Highlights</h3>

                <div style={styles.rightInsightList}>
                  {businessInsights.length === 0 ? (
                    <p style={styles.muted}>No findings available yet.</p>
                  ) : (
                    businessInsights.map((item, index) => (
                      <div key={index} style={styles.rightInsightCard}>
                        {item}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section style={styles.railCard}>
                <div style={styles.panelTag}>Location Intelligence</div>
                <h3 style={styles.panelTitle}>Top Areas</h3>

                <div style={styles.locationList}>
                  {locationStats.length === 0 ? (
                    <p style={styles.muted}>No location insights yet.</p>
                  ) : (
                    locationStats.slice(0, 6).map((item, index) => (
                      <div key={`${item.name}-${index}`} style={styles.locationRow}>
                        <span style={styles.locationName}>{item.name}</span>
                        <span style={styles.locationValue}>{item.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </aside>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 42%, #f8fafc 100%)",
    color: "#0f172a",
    position: "relative",
    overflow: "hidden",
  },

  pageGlowOne: {
    position: "absolute",
    top: "-120px",
    right: "-120px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(37,99,235,0.10)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  pageGlowTwo: {
    position: "absolute",
    left: "-100px",
    bottom: "-100px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(14,165,233,0.10)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 42%, #f8fafc 100%)",
    padding: "24px",
  },

  loadingCard: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: "28px",
    padding: "34px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 20px 54px rgba(15,23,42,0.12)",
    border: "1px solid rgba(255,255,255,0.84)",
    backdropFilter: "blur(12px)",
  },

  loadingBadge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    marginBottom: 14,
  },

  loadingTitle: {
    marginTop: 0,
    marginBottom: 10,
    color: "#0f172a",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    padding: "20px 28px",
    background: "rgba(255,255,255,0.78)",
    borderBottom: "1px solid rgba(226,232,240,0.9)",
    position: "sticky",
    top: 0,
    zIndex: 20,
    backdropFilter: "blur(14px)",
  },

  topBarLeft: {
    flex: 1,
    minWidth: "280px",
  },

  topKicker: {
    color: "#8a6242",
    fontWeight: 800,
    marginBottom: "8px",
    fontSize: "0.84rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },

  brand: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 900,
    letterSpacing: "0.01em",
    lineHeight: 1.1,
  },

  brandSub: {
    margin: "10px 0 0",
    color: "#64748b",
    maxWidth: "760px",
    lineHeight: 1.7,
  },

  topBarActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  ghostBtn: {
    border: "1px solid #cbd5e1",
    background: "rgba(255,255,255,0.88)",
    color: "#0f172a",
    padding: "12px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 800,
  },

  userBadge: {
    padding: "10px 14px",
    borderRadius: "16px",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
  },

  userName: {
    fontWeight: 800,
  },

  userRole: {
    color: "#64748b",
    fontSize: "0.88rem",
    textTransform: "capitalize",
  },

  logoutBtn: {
    border: "none",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 22px rgba(15,23,42,0.14)",
  },

  heroStrip: {
    padding: "42px 28px 26px",
    position: "relative",
    zIndex: 2,
  },

  heroTextWrap: {
    maxWidth: "1060px",
  },

  heroBadge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    color: "#8a6242",
    fontSize: "0.82rem",
    fontWeight: 800,
    marginBottom: "16px",
    boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
  },

  heroTitle: {
    margin: 0,
    fontSize: "2.65rem",
    lineHeight: 1.1,
    fontWeight: 900,
    color: "#0f172a",
    maxWidth: "980px",
  },

  heroText: {
    marginTop: "14px",
    maxWidth: "860px",
    lineHeight: 1.85,
    color: "#475569",
    fontSize: "1rem",
  },

  heroMetricRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
    marginTop: "22px",
    maxWidth: "900px",
  },

  heroMetricCard: {
    background: "rgba(255,255,255,0.84)",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
    borderRadius: "20px",
    padding: "16px 18px",
    backdropFilter: "blur(10px)",
  },

  heroMetricLabel: {
    fontSize: "0.86rem",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: 8,
  },

  heroMetricValue: {
    fontSize: "1rem",
    color: "#0f172a",
    fontWeight: 800,
    lineHeight: 1.5,
  },

  permissionsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    padding: "8px 28px 0",
    position: "relative",
    zIndex: 2,
  },

  permissionCard: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: "20px",
    padding: "16px 18px",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
    border: "1px solid rgba(255,255,255,0.88)",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    backdropFilter: "blur(10px)",
  },

  permissionIconBlue: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 900,
  },

  permissionIconTeal: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ccfbf1",
    color: "#0f766e",
    fontWeight: 900,
  },

  permissionIconRed: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fee2e2",
    color: "#b91c1c",
    fontWeight: 900,
  },

  permissionTitle: {
    fontWeight: 800,
    marginBottom: 4,
  },

  permissionValue: {
    color: "#475569",
    fontWeight: 600,
  },

  content: {
    padding: "24px 28px 44px",
    position: "relative",
    zIndex: 2,
  },

  mainShell: {
    display: "grid",
    gap: "22px",
    alignItems: "start",
  },

  sidePanel: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 16px 36px rgba(15,23,42,0.06)",
    border: "1px solid rgba(255,255,255,0.88)",
    backdropFilter: "blur(10px)",
  },

  centerPanel: {
    display: "grid",
    gap: "22px",
    minWidth: 0,
  },

  rightRail: {
    display: "grid",
    gap: "18px",
  },

  railCard: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 16px 36px rgba(15,23,42,0.06)",
    border: "1px solid rgba(255,255,255,0.88)",
    backdropFilter: "blur(10px)",
  },

  panelHead: {
    marginBottom: "16px",
  },

  panelTag: {
    color: "#8a6242",
    fontWeight: 800,
    fontSize: "0.82rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "1.18rem",
    fontWeight: 900,
  },

  panelText: {
    marginTop: "8px",
    color: "#64748b",
    lineHeight: 1.75,
  },

  navigatorRootBtn: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
    color: "#fff",
    padding: "14px 16px",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: "16px",
    boxShadow: "0 12px 24px rgba(29,78,216,0.16)",
  },

  navigatorRootBtnActive: {
    boxShadow: "0 0 0 3px rgba(37,99,235,0.16), 0 12px 24px rgba(29,78,216,0.16)",
  },

  treeWrap: {
    display: "grid",
    gap: "14px",
  },

  treeSection: {
    borderRadius: "18px",
    background: "linear-gradient(180deg, #fafafc 0%, #f8fafc 100%)",
    border: "1px solid #e7edf4",
    padding: "12px",
  },

  treeTopRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "8px",
    alignItems: "center",
  },

  treeChildren: {
    display: "grid",
    gap: "10px",
    marginTop: "10px",
  },

  treeProgramBlock: {
    display: "grid",
    gap: "8px",
  },

  treeGrandChildren: {
    display: "grid",
    gap: "8px",
    paddingLeft: "12px",
  },

  treeRoot: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "#ede9fe",
    color: "#4338ca",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  treeRootActive: {
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    boxShadow: "0 10px 22px rgba(37,99,235,0.14)",
  },

  treeProgram: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "#f4f7fb",
    color: "#1d4ed8",
    padding: "11px 13px",
    borderRadius: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  treeProgramActive: {
    background: "#dbeafe",
    color: "#1e3a8a",
    boxShadow: "0 8px 18px rgba(59,130,246,0.10)",
  },

  treeLeaf: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #dbe4ef",
    background: "#fff",
    color: "#334155",
    padding: "10px 12px",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  treeLeafActive: {
    background: "#eff6ff",
    border: "1px solid #93c5fd",
    color: "#1e3a8a",
    boxShadow: "0 8px 18px rgba(59,130,246,0.08)",
  },

  expandBtn: {
    width: "38px",
    height: "38px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  },

  expandBtnSmall: {
    width: "34px",
    height: "34px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  },

  cardPremium: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 16px 38px rgba(15,23,42,0.06)",
    border: "1px solid rgba(255,255,255,0.88)",
    minWidth: 0,
    backdropFilter: "blur(10px)",
  },

  reportArea: {
    display: "grid",
    gap: "22px",
  },

  reportHeaderCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "20px 24px",
    boxShadow: "0 14px 30px rgba(15,23,42,0.05)",
    border: "1px solid #ececec",
  },

  reportHeaderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },

  reportMetaBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px 14px",
    color: "#334155",
    minWidth: "220px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },

  smallTag: {
    color: "#8a6242",
    fontWeight: 800,
    fontSize: "0.8rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "1.24rem",
    fontWeight: 900,
  },

  sectionSub: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.7,
  },

  permissionBlock: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    padding: "14px 16px",
    borderRadius: "14px",
    fontWeight: 700,
  },

  formWrap: {
    display: "grid",
    gap: "16px",
  },

  switchRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  modeBtn: {
    border: "none",
    background: "#e2e8f0",
    color: "#0f172a",
    padding: "11px 16px",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  modeBtnActive: {
    border: "none",
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "11px 16px",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(59,130,246,0.10)",
  },

  modeBtnActiveWarn: {
    border: "none",
    background: "#fff7ed",
    color: "#c2410c",
    padding: "11px 16px",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(251,146,60,0.10)",
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    alignItems: "end",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 800,
    color: "#334155",
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid #d5dbe3",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    color: "#0f172a",
  },

  fileInput: {
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid #d5dbe3",
    background: "#fff",
    width: "100%",
    maxWidth: "420px",
    boxSizing: "border-box",
  },

  uploadRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  actionRow: {
    display: "flex",
    gap: "12px",
    marginTop: "14px",
    flexWrap: "wrap",
  },

  primaryBtn: {
    border: "none",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(37,99,235,0.16)",
  },

  secondaryBtn: {
    border: "none",
    background: "#e2e8f0",
    color: "#0f172a",
    padding: "12px 18px",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  deleteBtn: {
    border: "none",
    background: "#ef4444",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "10px",
    fontWeight: 800,
  },

  noteBox: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: 600,
  },

  noteWarn: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: 700,
  },

  filePreviewBox: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #e2e8f0",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: 600,
  },

  breadcrumbWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "14px 16px",
    background: "linear-gradient(180deg, #fafafc 0%, #f8fafc 100%)",
    border: "1px solid #e7edf4",
    borderRadius: "14px",
    marginBottom: "18px",
  },

  breadcrumbWrapRail: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },

  breadcrumbItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#334155",
    fontWeight: 700,
  },

  breadcrumbItemRail: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#334155",
    fontWeight: 700,
    fontSize: "0.92rem",
  },

  breadcrumbDivider: {
    color: "#94a3b8",
  },

  tabBar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  tabBtn: {
    border: "1px solid #dbe2ea",
    background: "rgba(255,255,255,0.82)",
    color: "#0f172a",
    padding: "12px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 800,
  },

  activeTabBtn: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 22px rgba(15,23,42,0.14)",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  summaryCard: {
    borderRadius: "20px",
    padding: "20px",
    background: "#fff",
    border: "1px solid #e2e8f0",
  },

  summaryPrimary: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },

  summaryWarn: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
  },

  summaryDark: {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
  },

  summaryCool: {
    background: "#ecfeff",
    border: "1px solid #a5f3fc",
  },

  summaryNeutral: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
  },

  summaryLabel: {
    fontSize: "0.95rem",
    color: "#475569",
    fontWeight: 800,
  },

  summaryValue: {
    marginTop: "10px",
    fontSize: "1.65rem",
    fontWeight: 900,
    lineHeight: 1.2,
    color: "#0f172a",
    wordBreak: "break-word",
  },

  insightList: {
    display: "grid",
    gap: "12px",
  },

  insightCard: {
    background: "linear-gradient(180deg, #fafafc 0%, #ffffff 100%)",
    border: "1px solid #e7edf4",
    borderRadius: "16px",
    padding: "14px 16px",
    lineHeight: 1.7,
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  insightDot: {
    width: 10,
    height: 10,
    borderRadius: "999px",
    background: "#2563eb",
    marginTop: 8,
    flexShrink: 0,
  },

  insightText: {
    flex: 1,
    color: "#334155",
    fontWeight: 600,
  },

  rightInsightList: {
    display: "grid",
    gap: "10px",
  },

  rightInsightCard: {
    background: "#fafafc",
    border: "1px solid #e7edf4",
    borderRadius: "14px",
    padding: "12px 14px",
    lineHeight: 1.65,
    fontSize: "0.94rem",
    color: "#334155",
    fontWeight: 600,
  },

  columnCardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  columnCard: {
    background: "linear-gradient(180deg, #fafafc 0%, #ffffff 100%)",
    border: "1px solid #e7edf4",
    borderRadius: "18px",
    padding: "18px",
  },

  columnName: {
    fontWeight: 900,
    fontSize: "1rem",
    marginBottom: "12px",
    color: "#0f172a",
  },

  columnMetaRow: {
    color: "#475569",
    marginBottom: "6px",
    fontWeight: 600,
  },

  previewTopStats: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },

  previewMiniCard: {
    minWidth: "160px",
    background: "linear-gradient(180deg, #fafafc 0%, #ffffff 100%)",
    border: "1px solid #e7edf4",
    borderRadius: "16px",
    padding: "14px 16px",
    fontWeight: 700,
    color: "#334155",
  },

  chipWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  chip: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "0.85rem",
    fontWeight: 800,
  },

  tableWrap: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "760px",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f1f5f9",
    color: "#0f172a",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 900,
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top",
    color: "#334155",
    fontWeight: 500,
  },

  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "18px",
  },

  chartCard: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 14px 30px rgba(15,23,42,0.05)",
    border: "1px solid rgba(255,255,255,0.88)",
    backdropFilter: "blur(10px)",
  },

  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 10,
    flexWrap: "wrap",
  },

  chartTitle: {
    fontSize: "1.12rem",
    fontWeight: 900,
    marginBottom: "6px",
    color: "#0f172a",
  },

  chartMeta: {
    color: "#64748b",
    marginBottom: "8px",
    fontSize: "0.92rem",
    fontWeight: 600,
  },

  chartTypeBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.04em",
  },

  locationList: {
    display: "grid",
    gap: "10px",
  },

  locationRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "#fafafc",
    border: "1px solid #e7edf4",
  },

  locationName: {
    color: "#334155",
    fontWeight: 700,
  },

  locationValue: {
    color: "#1d4ed8",
    fontWeight: 900,
  },

  muted: {
    color: "#64748b",
    lineHeight: 1.7,
  },
};