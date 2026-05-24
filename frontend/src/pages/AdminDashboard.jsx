import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
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
} from "recharts";

const COLORS = [
  "#1d4ed8",
  "#0f766e",
  "#b45309",
  "#b91c1c",
  "#6d28d9",
  "#0369a1",
  "#15803d",
  "#c2410c",
  "#7c3aed",
  "#0ea5e9",
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(true);
  const [pageRefreshing, setPageRefreshing] = useState(false);

  const [users, setUsers] = useState([]);
  const [types, setTypes] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [adminAnalytics, setAdminAnalytics] = useState(null);

  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const [programForm, setProgramForm] = useState({ name: "", typeId: "" });
  const [batchForm, setBatchForm] = useState({
    name: "",
    typeId: "",
    programId: "",
  });

  const [editingProgramId, setEditingProgramId] = useState("");
  const [editingProgramName, setEditingProgramName] = useState("");
  const [editingBatchId, setEditingBatchId] = useState("");
  const [editingBatchName, setEditingBatchName] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [uploadSearch, setUploadSearch] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const safeAlert = (message) => {
    window.alert(message);
  };

  const fetchUsers = async () => {
    const res = await axiosInstance.get("/api/users");
    setUsers(Array.isArray(res.data) ? res.data : []);
  };

  const fetchDirections = async () => {
    const [typesRes, programsRes, batchesRes] = await Promise.all([
      axiosInstance.get("/api/directions/types"),
      axiosInstance.get("/api/directions/programs"),
      axiosInstance.get("/api/directions/batches"),
    ]);

    const typeData = Array.isArray(typesRes.data) ? typesRes.data : [];
    const programData = Array.isArray(programsRes.data) ? programsRes.data : [];
    const batchData = Array.isArray(batchesRes.data) ? batchesRes.data : [];

    setTypes(typeData);
    setPrograms(programData);
    setBatches(batchData);

    if (!selectedTypeId && typeData.length > 0) {
      const firstTypeId = typeData[0]._id;
      setSelectedTypeId(firstTypeId);
      setProgramForm({ name: "", typeId: firstTypeId });
      setBatchForm({ name: "", typeId: firstTypeId, programId: "" });
    }
  };

  const fetchAdminAnalytics = async () => {
    const res = await axiosInstance.get("/api/admin-analytics/overview");
    setAdminAnalytics(res.data || null);
  };

  const loadAll = async ({ silent = false } = {}) => {
    try {
      if (silent) setPageRefreshing(true);
      else setLoading(true);

      await Promise.all([
        fetchUsers(),
        fetchDirections(),
        fetchAdminAnalytics(),
      ]);
    } catch (err) {
      safeAlert(
        err.response?.data?.message || "Failed to load admin dashboard."
      );
    } finally {
      setLoading(false);
      setPageRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedType = useMemo(
    () => types.find((item) => item._id === selectedTypeId),
    [types, selectedTypeId]
  );

  const selectedTypeCode = selectedType?.code || "";
  const isNewRegistration = selectedTypeCode === "NEW_REGISTRATION";
  const isWorkshop = selectedTypeCode === "WORKSHOPS";
  const isOngoing = selectedTypeCode === "ONGOING_BATCHES";

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => program.typeId?._id === selectedTypeId);
  }, [programs, selectedTypeId]);

  const filteredBatches = useMemo(() => {
    if (!selectedTypeId) return [];

    if (isNewRegistration) {
      return batches.filter(
        (batch) => batch.typeId?._id === selectedTypeId && !batch.programId
      );
    }

    if (!selectedProgramId) return [];

    return batches.filter(
      (batch) =>
        batch.typeId?._id === selectedTypeId &&
        batch.programId?._id === selectedProgramId
    );
  }, [batches, selectedTypeId, selectedProgramId, isNewRegistration]);

  const pendingUsers = useMemo(
    () => users.filter((item) => !item.isApproved),
    [users]
  );

  const approvedUsers = useMemo(
    () => users.filter((item) => item.isApproved),
    [users]
  );

  const visiblePendingUsers = useMemo(() => {
    const key = userSearch.trim().toLowerCase();
    if (!key) return pendingUsers;
    return pendingUsers.filter(
      (item) =>
        item.name?.toLowerCase().includes(key) ||
        item.email?.toLowerCase().includes(key) ||
        item.role?.toLowerCase().includes(key)
    );
  }, [pendingUsers, userSearch]);

  const visibleApprovedUsers = useMemo(() => {
    const key = userSearch.trim().toLowerCase();
    const nonAdmins = approvedUsers.filter((item) => item.role !== "admin");

    if (!key) return nonAdmins;

    return nonAdmins.filter(
      (item) =>
        item.name?.toLowerCase().includes(key) ||
        item.email?.toLowerCase().includes(key) ||
        item.role?.toLowerCase().includes(key)
    );
  }, [approvedUsers, userSearch]);

  const summary = adminAnalytics?.summary || {};
  const charts = adminAnalytics?.charts || {};
  const recentUploads = adminAnalytics?.recentUploads || [];

  const filteredRecentUploads = useMemo(() => {
    const key = uploadSearch.trim().toLowerCase();
    if (!key) return recentUploads;

    return recentUploads.filter((item) => {
      return [
        item.originalName,
        item.uploadedBy,
        item.typeName,
        item.programName,
        item.batchName,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(key));
    });
  }, [recentUploads, uploadSearch]);

  const completionRate = useMemo(() => {
    const total = summary.totalUsers || 0;
    const approved = summary.approvedUsers || 0;
    if (!total) return 0;
    return Math.round((approved / total) * 100);
  }, [summary.totalUsers, summary.approvedUsers]);

  const handleTypeChange = (typeId) => {
    setSelectedTypeId(typeId);
    setSelectedProgramId("");
    setProgramForm({ name: "", typeId });
    setBatchForm({ name: "", typeId, programId: "" });
    setEditingProgramId("");
    setEditingProgramName("");
    setEditingBatchId("");
    setEditingBatchName("");
  };

  const handleProgramSelect = (programId) => {
    setSelectedProgramId(programId);
    setBatchForm((prev) => ({ ...prev, programId }));
    setEditingBatchId("");
    setEditingBatchName("");
  };

  const handleApproveUser = async (id) => {
    try {
      await axiosInstance.put(`/api/users/approve/${id}`);
      await Promise.all([fetchUsers(), fetchAdminAnalytics()]);
      safeAlert("User approved successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Approval failed.");
    }
  };

  const handlePermissionChange = (id, key, value) => {
    setUsers((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              permissions: {
                ...item.permissions,
                [key]: value,
              },
            }
          : item
      )
    );
  };

  const savePermissions = async (targetUser) => {
    try {
      await axiosInstance.put(`/api/users/permissions/${targetUser._id}`, {
        canView: !!targetUser.permissions?.canView,
        canUpload: !!targetUser.permissions?.canUpload,
        canUpdate: !!targetUser.permissions?.canUpdate,
        canDelete: !!targetUser.permissions?.canDelete,
      });
      await fetchUsers();
      safeAlert("Permissions updated successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Permission update failed.");
    }
  };

  const createProgram = async (e) => {
    e.preventDefault();

    try {
      if (!programForm.typeId || !programForm.name.trim()) {
        safeAlert("Please select a type and enter a program name.");
        return;
      }

      if (isNewRegistration) {
        safeAlert("New Registration does not use programs.");
        return;
      }

      await axiosInstance.post("/api/directions/programs", {
        name: programForm.name.trim(),
        typeId: programForm.typeId,
      });

      setProgramForm({ name: "", typeId: selectedTypeId });
      await fetchDirections();
      safeAlert("Program created successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to create program.");
    }
  };

  const updateProgram = async (id) => {
    try {
      if (!editingProgramName.trim()) {
        safeAlert("Program name cannot be empty.");
        return;
      }

      await axiosInstance.put(`/api/directions/programs/${id}`, {
        name: editingProgramName.trim(),
        typeId: selectedTypeId,
      });

      setEditingProgramId("");
      setEditingProgramName("");
      await fetchDirections();
      safeAlert("Program updated successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to update program.");
    }
  };

  const deleteProgram = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this program?"
    );
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/api/directions/programs/${id}`);
      await fetchDirections();
      if (selectedProgramId === id) setSelectedProgramId("");
      safeAlert("Program deleted successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to delete program.");
    }
  };

  const createBatch = async (e) => {
    e.preventDefault();

    try {
      if (!batchForm.typeId || !batchForm.name.trim()) {
        safeAlert("Please enter the required details.");
        return;
      }

      const payload = {
        name: batchForm.name.trim(),
        typeId: batchForm.typeId,
      };

      if (!isNewRegistration) {
        if (!batchForm.programId) {
          safeAlert("Please select a program or group first.");
          return;
        }
        payload.programId = batchForm.programId;
      }

      await axiosInstance.post("/api/directions/batches", payload);

      setBatchForm({
        name: "",
        typeId: selectedTypeId,
        programId: isNewRegistration ? "" : selectedProgramId,
      });

      await fetchDirections();
      safeAlert(isNewRegistration ? "Month created successfully." : "Batch created successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to create batch/month.");
    }
  };

  const updateBatch = async (id) => {
    try {
      if (!editingBatchName.trim()) {
        safeAlert("Batch or month name cannot be empty.");
        return;
      }

      const payload = {
        name: editingBatchName.trim(),
        typeId: selectedTypeId,
      };

      if (!isNewRegistration) {
        if (!selectedProgramId) {
          safeAlert("Please select a program before updating the batch.");
          return;
        }
        payload.programId = selectedProgramId;
      }

      await axiosInstance.put(`/api/directions/batches/${id}`, payload);

      setEditingBatchId("");
      setEditingBatchName("");
      await fetchDirections();
      safeAlert("Batch updated successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to update batch.");
    }
  };

  const deleteBatch = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this batch or month?"
    );
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/api/directions/batches/${id}`);
      await Promise.all([fetchDirections(), fetchAdminAnalytics()]);
      safeAlert("Batch deleted successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to delete batch.");
    }
  };

  const deleteUpload = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this upload?"
    );
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/api/uploads/${id}`);
      await fetchAdminAnalytics();
      safeAlert("Upload deleted successfully.");
    } catch (err) {
      safeAlert(err.response?.data?.message || "Failed to delete upload.");
    }
  };

  const exportCsv = async () => {
    try {
      const response = await axiosInstance.get("/api/admin-analytics/export-csv", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "csbm-admin-summary.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      safeAlert(err.response?.data?.message || "CSV export failed.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const renderBarChart = (data, dataKey = "value") => (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-16}
          textAnchor="end"
          interval={0}
          height={75}
          tick={{ fontSize: 11 }}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKey} fill="#2563eb" radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = (data) => (
    <ResponsiveContainer width="100%" height={290}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
          {data.map((entry, index) => (
            <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingBadge}>Admin Workspace</div>
          <h2 style={styles.loadingTitle}>Loading admin dashboard...</h2>
          <p style={styles.loadingText}>
            Preparing users, directions, uploads, and analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageGlowOne} />
      <div style={styles.pageGlowTwo} />

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.kicker}>Analytics Workspace</div>
          <h1 style={styles.headerTitle}>CSBM Admin Intelligence Center</h1>
          <p style={styles.headerText}>
            Welcome {user?.name || "Admin"} — manage user approvals, permissions,
            direction structure, uploads, and platform-wide analytics from one place.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.ghostBtn}
            onClick={() => loadAll({ silent: true })}
          >
            {pageRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button style={styles.secondaryBtnDark} onClick={exportCsv}>
            Export CSV
          </button>
          <button style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section style={styles.topInsightGrid}>
        <div style={styles.progressCard}>
          <div style={styles.progressHeader}>
            <div>
              <p style={styles.progressLabel}>Approval Progress</p>
              <h3 style={styles.progressValue}>{completionRate}%</h3>
            </div>
            <div style={styles.progressMiniStat}>
              {summary.approvedUsers || 0} / {summary.totalUsers || 0}
            </div>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${completionRate}%`,
              }}
            />
          </div>

          <p style={styles.progressText}>
            Measures how many registered users are approved and ready to use the system.
          </p>
        </div>

        <div style={styles.quickInfoCard}>
          <h3 style={styles.quickInfoTitle}>System Focus Right Now</h3>
          <div style={styles.quickChipWrap}>
            <span style={styles.quickChipBlue}>
              Pending Users: {summary.pendingUsers || 0}
            </span>
            <span style={styles.quickChipAmber}>
              Missing A/L: {summary.missingAL || 0}
            </span>
            <span style={styles.quickChipOrange}>
              Missing O/L: {summary.missingOL || 0}
            </span>
            <span style={styles.quickChipTeal}>
              Active Programs: {summary.totalProgramsWithUploads || 0}
            </span>
          </div>
          <p style={styles.quickInfoText}>
            Use this area to quickly identify operational pressure points before reviewing
            detailed charts and records below.
          </p>
        </div>
      </section>

      <section style={styles.heroGrid}>
        <StatCard title="Total Users" value={summary.totalUsers || 0} />
        <StatCard title="Approved Users" value={summary.approvedUsers || 0} />
        <StatCard title="Pending Approvals" value={summary.pendingUsers || 0} />
        <StatCard title="Total Uploads" value={summary.totalUploads || 0} />
        <StatCard title="Total Parsed Rows" value={summary.totalRows || 0} />
        <StatCard title="Active Programs" value={summary.totalProgramsWithUploads || 0} />
        <StatCardWarn title="Missing Service Letters" value={summary.missingServiceLetter || 0} />
        <StatCardWarn title="Missing A/L" value={summary.missingAL || 0} />
        <StatCardWarn title="Missing O/L" value={summary.missingOL || 0} />
      </section>

      <section style={styles.navTabs}>
        {[
          { key: "overview", label: "Overview" },
          { key: "users", label: "Users & Permissions" },
          { key: "directions", label: "Direction Setup" },
          { key: "uploads", label: "Upload Manager" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            style={{
              ...styles.tabBtn,
              ...(activeSection === tab.key ? styles.tabBtnActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeSection === "overview" && (
        <>
          <section style={styles.chartGrid}>
            <ChartCard title="Uploads by Type">
              {charts.uploadByType?.length ? (
                renderPieChart(charts.uploadByType)
              ) : (
                <p style={styles.muted}>No data available.</p>
              )}
            </ChartCard>

            <ChartCard title="Uploads by Program">
              {charts.uploadByProgram?.length ? (
                renderBarChart(charts.uploadByProgram)
              ) : (
                <p style={styles.muted}>No data available.</p>
              )}
            </ChartCard>

            <ChartCard title="Rows by Program">
              {charts.rowsByProgram?.length ? (
                renderBarChart(charts.rowsByProgram)
              ) : (
                <p style={styles.muted}>No data available.</p>
              )}
            </ChartCard>

            <ChartCard title="Uploads by User">
              {charts.uploadsByUser?.length ? (
                renderBarChart(charts.uploadsByUser)
              ) : (
                <p style={styles.muted}>No data available.</p>
              )}
            </ChartCard>

            <ChartCard title="Rows by User">
              {charts.rowsByUser?.length ? (
                renderBarChart(charts.rowsByUser)
              ) : (
                <p style={styles.muted}>No data available.</p>
              )}
            </ChartCard>

            <ChartCard title="Top Student Locations">
              {charts.locationStats?.length ? (
                renderBarChart(charts.locationStats)
              ) : (
                <p style={styles.muted}>No data available.</p>
              )}
            </ChartCard>
          </section>

          <section style={styles.dualGrid}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Admin Summary Notes</h2>
              <div style={styles.summaryStack}>
                <div style={styles.summaryNote}>
                  <strong>User Approval Status:</strong> {summary.pendingUsers || 0} pending users
                  still require admin action.
                </div>
                <div style={styles.summaryNote}>
                  <strong>Upload Coverage:</strong> {summary.totalUploads || 0} uploads are currently
                  stored in the analytics system.
                </div>
                <div style={styles.summaryNote}>
                  <strong>Data Processing Scale:</strong> {summary.totalRows || 0} rows have already
                  been parsed and made ready for analysis.
                </div>
                <div style={styles.summaryNote}>
                  <strong>Program Activity:</strong> {summary.totalProgramsWithUploads || 0} programs
                  currently contain upload activity.
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Recommended Admin Actions</h2>
              <div style={styles.actionChecklist}>
                <div style={styles.actionItem}>
                  Review and approve pending users before they contact admin for access.
                </div>
                <div style={styles.actionItem}>
                  Ensure direction structure matches your required hierarchy for each type.
                </div>
                <div style={styles.actionItem}>
                  Remove wrong uploads to keep charts and insights accurate.
                </div>
                <div style={styles.actionItem}>
                  Save user permissions carefully so staff only see the actions they should access.
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {activeSection === "users" && (
        <div style={styles.mainGrid}>
          <section style={styles.card}>
            <div style={styles.cardToolbar}>
              <h2 style={styles.cardTitleNoMargin}>Pending User Approvals</h2>
              <input
                style={styles.searchInput}
                placeholder="Search users by name, email, role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            {visiblePendingUsers.length === 0 ? (
              <p style={styles.muted}>No pending users found.</p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePendingUsers.map((item) => (
                      <tr key={item._id}>
                        <td style={styles.td}>{item.name}</td>
                        <td style={styles.td}>{item.email}</td>
                        <td style={styles.td}>{item.role}</td>
                        <td style={styles.td}>
                          <button
                            style={styles.primaryBtn}
                            onClick={() => handleApproveUser(item._id)}
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={styles.card}>
            <div style={styles.cardToolbar}>
              <h2 style={styles.cardTitleNoMargin}>Approved Users & Permissions</h2>
              <div style={styles.inlineMeta}>
                <span style={styles.smallBadge}>
                  Total Approved: {approvedUsers.filter((item) => item.role !== "admin").length}
                </span>
              </div>
            </div>

            {visibleApprovedUsers.length === 0 ? (
              <p style={styles.muted}>No approved users found.</p>
            ) : (
              <div style={styles.userCards}>
                {visibleApprovedUsers.map((item) => (
                  <div key={item._id} style={styles.userCard}>
                    <div style={styles.userHeader}>
                      <div>
                        <h3 style={styles.userName}>{item.name}</h3>
                        <p style={styles.userEmail}>{item.email}</p>
                      </div>
                      <span style={styles.rolePill}>{item.role || "user"}</span>
                    </div>

                    <div style={styles.permissionTitle}>Permissions</div>

                    <div style={styles.permissionGrid}>
                      {[
                        { key: "canView", label: "View Analytics" },
                        { key: "canUpload", label: "Upload Data" },
                        { key: "canUpdate", label: "Update Records" },
                        { key: "canDelete", label: "Delete Records" },
                      ].map((perm) => (
                        <label key={perm.key} style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={!!item.permissions?.[perm.key]}
                            onChange={(e) =>
                              handlePermissionChange(
                                item._id,
                                perm.key,
                                e.target.checked
                              )
                            }
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      style={styles.primaryBtn}
                      onClick={() => savePermissions(item)}
                    >
                      Save Permissions
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeSection === "directions" && (
        <div style={styles.mainGrid}>
          <section style={styles.card}>
            <div style={styles.cardToolbar}>
              <h2 style={styles.cardTitleNoMargin}>Direction Setup</h2>
              <span style={styles.smallBadge}>
                Admin-defined hierarchy only
              </span>
            </div>

            <div style={styles.directionTopGrid}>
              <div>
                <label style={styles.label}>Select Type</label>
                <select
                  style={styles.input}
                  value={selectedTypeId}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="">Select Type</option>
                  {types.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.flowPanel}>
                <div style={styles.flowTitle}>Current Hierarchy Flow</div>
                <div style={styles.flowText}>
                  {isOngoing && "Ongoing Batches → Program → Batch"}
                  {isWorkshop && "Workshops → Program / Group → Batch / Month / Session"}
                  {isNewRegistration && "New Registration → Month only"}
                  {!selectedTypeId && "Please select a type to view the flow."}
                </div>
              </div>
            </div>

            {!isNewRegistration && (
              <>
                <div style={styles.sectionBlock}>
                  <h3 style={styles.subTitle}>
                    {isWorkshop ? "Create Workshop Program / Group" : "Create Program"}
                  </h3>

                  <form onSubmit={createProgram} style={styles.inlineForm}>
                    <input
                      style={styles.input}
                      placeholder={
                        isWorkshop
                          ? "Enter workshop program / group name"
                          : "Enter program name"
                      }
                      value={programForm.name}
                      onChange={(e) =>
                        setProgramForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                    <button type="submit" style={styles.primaryBtn}>
                      Add Program
                    </button>
                  </form>
                </div>

                <div style={styles.sectionBlock}>
                  <div style={styles.blockHeader}>
                    <h3 style={styles.subTitleNoMargin}>Available Programs / Groups</h3>
                    <span style={styles.smallBadge}>
                      {filteredPrograms.length} item(s)
                    </span>
                  </div>

                  {filteredPrograms.length === 0 ? (
                    <p style={styles.muted}>No programs available for this type.</p>
                  ) : (
                    <div style={styles.listWrap}>
                      {filteredPrograms.map((program) => (
                        <div
                          key={program._id}
                          style={{
                            ...styles.listRow,
                            ...(selectedProgramId === program._id
                              ? styles.listRowActive
                              : {}),
                          }}
                        >
                          <button
                            style={styles.selectBtn}
                            onClick={() => handleProgramSelect(program._id)}
                          >
                            Select
                          </button>

                          {editingProgramId === program._id ? (
                            <>
                              <input
                                style={styles.smallInput}
                                value={editingProgramName}
                                onChange={(e) =>
                                  setEditingProgramName(e.target.value)
                                }
                              />
                              <button
                                style={styles.primaryBtn}
                                onClick={() => updateProgram(program._id)}
                              >
                                Save
                              </button>
                              <button
                                style={styles.secondaryBtn}
                                onClick={() => {
                                  setEditingProgramId("");
                                  setEditingProgramName("");
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <div style={styles.listText}>{program.name}</div>
                              <button
                                style={styles.secondaryBtn}
                                onClick={() => {
                                  setEditingProgramId(program._id);
                                  setEditingProgramName(program.name);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                style={styles.dangerBtn}
                                onClick={() => deleteProgram(program._id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={styles.sectionBlock}>
              <h3 style={styles.subTitle}>
                {isNewRegistration ? "Create Month" : "Create Batch / Month / Session"}
              </h3>

              <form onSubmit={createBatch} style={styles.inlineForm}>
                <input
                  style={styles.input}
                  placeholder={
                    isNewRegistration
                      ? "Enter month name"
                      : "Enter batch / month / session name"
                  }
                  value={batchForm.name}
                  onChange={(e) =>
                    setBatchForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
                <button type="submit" style={styles.primaryBtn}>
                  Add {isNewRegistration ? "Month" : "Batch"}
                </button>
              </form>
            </div>

            <div style={styles.sectionBlock}>
              <div style={styles.blockHeader}>
                <h3 style={styles.subTitleNoMargin}>
                  {isNewRegistration ? "Available Months" : "Available Batches / Months"}
                </h3>
                <span style={styles.smallBadge}>{filteredBatches.length} item(s)</span>
              </div>

              {filteredBatches.length === 0 ? (
                <p style={styles.muted}>
                  {isNewRegistration
                    ? "No months available for this type."
                    : "Select a program first. Then related batches will appear here."}
                </p>
              ) : (
                <div style={styles.listWrap}>
                  {filteredBatches.map((batch) => (
                    <div key={batch._id} style={styles.listRow}>
                      {editingBatchId === batch._id ? (
                        <>
                          <input
                            style={styles.smallInput}
                            value={editingBatchName}
                            onChange={(e) => setEditingBatchName(e.target.value)}
                          />
                          <button
                            style={styles.primaryBtn}
                            onClick={() => updateBatch(batch._id)}
                          >
                            Save
                          </button>
                          <button
                            style={styles.secondaryBtn}
                            onClick={() => {
                              setEditingBatchId("");
                              setEditingBatchName("");
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={styles.listText}>{batch.name}</div>
                          <button
                            style={styles.secondaryBtn}
                            onClick={() => {
                              setEditingBatchId(batch._id);
                              setEditingBatchName(batch.name);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            style={styles.dangerBtn}
                            onClick={() => deleteBatch(batch._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {activeSection === "uploads" && (
        <div style={styles.mainGrid}>
          <section style={styles.card}>
            <div style={styles.cardToolbar}>
              <h2 style={styles.cardTitleNoMargin}>Recent Upload Manager</h2>
              <input
                style={styles.searchInput}
                placeholder="Search file, user, type, program, batch..."
                value={uploadSearch}
                onChange={(e) => setUploadSearch(e.target.value)}
              />
            </div>

            {filteredRecentUploads.length === 0 ? (
              <p style={styles.muted}>No uploads found.</p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>File</th>
                      <th style={styles.th}>User</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Program</th>
                      <th style={styles.th}>Batch</th>
                      <th style={styles.th}>Rows</th>
                      <th style={styles.th}>Uploaded At</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecentUploads.map((item) => (
                      <tr key={item._id}>
                        <td style={styles.td}>{item.originalName}</td>
                        <td style={styles.td}>{item.uploadedBy}</td>
                        <td style={styles.td}>{item.typeName}</td>
                        <td style={styles.td}>{item.programName || "Not needed"}</td>
                        <td style={styles.td}>{item.batchName}</td>
                        <td style={styles.td}>{item.rowCount}</td>
                        <td style={styles.td}>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td style={styles.td}>
                          <button
                            style={styles.dangerBtn}
                            onClick={() => deleteUpload(item._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={styles.heroCard}>
      <h3 style={styles.heroNumber}>{value}</h3>
      <p style={styles.heroLabel}>{title}</p>
    </div>
  );
}

function StatCardWarn({ title, value }) {
  return (
    <div style={styles.heroCardWarn}>
      <h3 style={styles.heroNumberWarn}>{value}</h3>
      <p style={styles.heroLabel}>{title}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={styles.chartCard}>
      <h3 style={styles.cardTitle}>{title}</h3>
      {children}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2ff 38%, #f8fafc 100%)",
    padding: "24px",
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
    background: "rgba(59,130,246,0.10)",
    filter: "blur(20px)",
    pointerEvents: "none",
  },

  pageGlowTwo: {
    position: "absolute",
    bottom: "-100px",
    left: "-100px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(14,165,233,0.10)",
    filter: "blur(20px)",
    pointerEvents: "none",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2ff 38%, #f8fafc 100%)",
    padding: "24px",
  },

  loadingCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "28px",
    padding: "36px",
    width: "100%",
    maxWidth: "540px",
    boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
    border: "1px solid rgba(255,255,255,0.75)",
    backdropFilter: "blur(8px)",
  },

  loadingBadge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: 14,
  },

  loadingTitle: {
    marginTop: 0,
    marginBottom: 10,
    color: "#0f172a",
  },

  loadingText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },

  kicker: {
    color: "#8b5e3c",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: 8,
    textTransform: "uppercase",
    fontSize: 12,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "26px",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 2,
  },

  headerLeft: {
    flex: 1,
    minWidth: "280px",
  },

  headerActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  headerTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "2.2rem",
    fontWeight: 900,
    lineHeight: 1.1,
  },

  headerText: {
    margin: "10px 0 0",
    color: "#64748b",
    lineHeight: 1.7,
    maxWidth: "860px",
  },

  navTabs: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 22,
    position: "relative",
    zIndex: 2,
  },

  tabBtn: {
    border: "1px solid #cbd5e1",
    background: "rgba(255,255,255,0.75)",
    color: "#0f172a",
    padding: "12px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: 800,
    backdropFilter: "blur(8px)",
  },

  tabBtnActive: {
    background: "#0f172a",
    color: "#ffffff",
    borderColor: "#0f172a",
    boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
  },

  ghostBtn: {
    border: "1px solid #cbd5e1",
    background: "rgba(255,255,255,0.82)",
    color: "#0f172a",
    padding: "12px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 700,
  },

  secondaryBtnDark: {
    border: "none",
    background: "#1e293b",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 700,
  },

  logoutBtn: {
    border: "none",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 12px 22px rgba(15,23,42,0.15)",
  },

  topInsightGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: "18px",
    marginBottom: "20px",
    position: "relative",
    zIndex: 2,
  },

  progressCard: {
    background: "rgba(255,255,255,0.88)",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
    border: "1px solid rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },

  progressLabel: {
    margin: 0,
    color: "#64748b",
    fontWeight: 700,
    fontSize: 14,
  },

  progressValue: {
    margin: "6px 0 0",
    fontSize: "2rem",
    color: "#0f172a",
  },

  progressMiniStat: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
  },

  progressTrack: {
    width: "100%",
    height: "14px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 14,
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)",
  },

  progressText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.7,
  },

  quickInfoCard: {
    background: "rgba(255,255,255,0.88)",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
    border: "1px solid rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
  },

  quickInfoTitle: {
    marginTop: 0,
    marginBottom: 14,
    color: "#0f172a",
  },

  quickChipWrap: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  quickChipBlue: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: 13,
  },

  quickChipAmber: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 800,
    fontSize: 13,
  },

  quickChipOrange: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#ffedd5",
    color: "#c2410c",
    fontWeight: 800,
    fontSize: 13,
  },

  quickChipTeal: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#ccfbf1",
    color: "#0f766e",
    fontWeight: 800,
    fontSize: 13,
  },

  quickInfoText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.7,
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
    position: "relative",
    zIndex: 2,
  },

  heroCard: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(255,255,255,0.8)",
    backdropFilter: "blur(8px)",
  },

  heroCardWarn: {
    background: "rgba(255,247,237,0.95)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #fed7aa",
    backdropFilter: "blur(8px)",
  },

  heroNumber: {
    margin: 0,
    fontSize: "2rem",
    color: "#2563eb",
    fontWeight: 900,
  },

  heroNumberWarn: {
    margin: 0,
    fontSize: "2rem",
    color: "#c2410c",
    fontWeight: 900,
  },

  heroLabel: {
    margin: "8px 0 0",
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.5,
  },

  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "18px",
    marginBottom: 24,
    position: "relative",
    zIndex: 2,
  },

  chartCard: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: "26px",
    padding: "22px",
    boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
    border: "1px solid rgba(255,255,255,0.82)",
    backdropFilter: "blur(8px)",
  },

  dualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "22px",
    marginBottom: 24,
    position: "relative",
    zIndex: 2,
  },

  mainGrid: {
    display: "grid",
    gap: "24px",
    position: "relative",
    zIndex: 2,
  },

  card: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(255,255,255,0.85)",
    backdropFilter: "blur(8px)",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: "18px",
    color: "#0f172a",
  },

  cardTitleNoMargin: {
    margin: 0,
    color: "#0f172a",
  },

  cardToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  summaryStack: {
    display: "grid",
    gap: 12,
  },

  summaryNote: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #e2e8f0",
    lineHeight: 1.7,
  },

  actionChecklist: {
    display: "grid",
    gap: 12,
  },

  actionItem: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#1e3a8a",
    fontWeight: 600,
    lineHeight: 1.6,
  },

  muted: {
    color: "#64748b",
    lineHeight: 1.6,
  },

  searchInput: {
    minWidth: "260px",
    width: "100%",
    maxWidth: "360px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    outline: "none",
    background: "#fff",
    color: "#0f172a",
  },

  smallBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: 12,
  },

  inlineMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  tableWrap: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 760,
  },

  th: {
    textAlign: "left",
    padding: "14px 12px",
    background: "#eff6ff",
    color: "#1e3a8a",
    borderBottom: "1px solid #dbeafe",
    fontWeight: 800,
    fontSize: 14,
  },

  td: {
    padding: "13px 12px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top",
    color: "#0f172a",
  },

  userCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },

  userCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "18px",
    background:
      "linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(255,255,255,0.96) 100%)",
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  },

  userHeader: {
    marginBottom: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  userName: {
    margin: 0,
    color: "#0f172a",
    fontSize: "1.05rem",
  },

  userEmail: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "0.95rem",
    wordBreak: "break-word",
  },

  rolePill: {
    padding: "8px 10px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#0f172a",
    fontWeight: 800,
    fontSize: 12,
    textTransform: "capitalize",
  },

  permissionTitle: {
    fontWeight: 800,
    color: "#334155",
    marginBottom: 12,
  },

  permissionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
    gap: "10px",
    marginBottom: "14px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#334155",
    fontSize: "0.95rem",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
  },

  directionTopGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 360px) 1fr",
    gap: "16px",
    marginBottom: "18px",
  },

  flowPanel: {
    padding: "18px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)",
    border: "1px solid #dbeafe",
  },

  flowTitle: {
    fontWeight: 900,
    color: "#1d4ed8",
    marginBottom: 8,
  },

  flowText: {
    color: "#334155",
    fontWeight: 700,
    lineHeight: 1.6,
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 800,
    color: "#334155",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: "#0f172a",
  },

  smallInput: {
    flex: 1,
    minWidth: "160px",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    outline: "none",
    background: "#fff",
    color: "#0f172a",
  },

  inlineForm: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  sectionBlock: {
    marginTop: "24px",
  },

  blockHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  subTitle: {
    marginTop: 0,
    marginBottom: "12px",
    color: "#0f172a",
  },

  subTitleNoMargin: {
    margin: 0,
    color: "#0f172a",
  },

  listWrap: {
    display: "grid",
    gap: "12px",
  },

  listRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
    background: "#fff",
    borderRadius: "16px",
    padding: "14px",
    border: "1px solid #e2e8f0",
  },

  listRowActive: {
    border: "2px solid #2563eb",
    boxShadow: "0 10px 24px rgba(37,99,235,0.10)",
    background: "#f8fbff",
  },

  listText: {
    flex: 1,
    minWidth: "180px",
    fontWeight: 700,
    color: "#0f172a",
  },

  selectBtn: {
    border: "none",
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 800,
  },

  primaryBtn: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 18px rgba(37,99,235,0.16)",
  },

  secondaryBtn: {
    border: "none",
    background: "#e2e8f0",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 800,
  },

  dangerBtn: {
    border: "none",
    background: "#ef4444",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 18px rgba(239,68,68,0.14)",
  },
};