import React, { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import axios from "axios";
import SearchIcon from "@mui/icons-material/Search";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import GetAppIcon from "@mui/icons-material/GetApp";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import UpdateIcon from "@mui/icons-material/Update";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AddIcon from "@mui/icons-material/Add";

const CATEGORIES = [
  "signage",
  "marking",
  "barrier",
  "lighting",
  "surfacing",
  "equipment",
  "other",
];

const SOURCE_ICONS = {
  CPWD_SOR: "",
  GeM: "",
};

const SOURCE_COLORS = {
  CPWD_SOR: "#3B82F6",
  GeM: "#8B5CF6",
};

export default function PriceManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    categories: 0,
    avgPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    lastUpdated: null,
  });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sourceStats, setSourceStats] = useState({});
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    itemName: "",
    category: "",
    unitPrice: "",
    unit: "",
    source: "",
    itemCode: "",
    description: "",
  });
  const [addForm, setAddForm] = useState({
    itemName: "",
    category: "",
    unitPrice: "",
    unit: "",
    source: "CPWD_SOR",
    itemCode: "",
    description: "",
    sourceUrl: "",
    ircReference: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRefresh = () => {
    showSnackbar("🔄 Refreshing data from database...", "info");
    search();
  };

  const search = async () => {
    setLoading(true);
    try {
      const params = { query };
      if (categoryFilter) params.category = categoryFilter;
      if (sourceFilter) params.source = sourceFilter;

      const response = await axios.get(`${apiUrl}/api/prices/search`, {
        params,
      });

      const data = response.data.data || [];
      setResults(data);

      if (data.length > 0) {
        const prices = data.map((item) => item.unitPrice || 0);
        const categories = new Set(data.map((item) => item.category)).size;
        const avgPrice = Math.round(
          prices.reduce((a, b) => a + b, 0) / prices.length
        );
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        const srcStats = {};
        data.forEach((item) => {
          if (!srcStats[item.source]) {
            srcStats[item.source] = { count: 0, total: 0 };
          }
          srcStats[item.source].count += 1;
          srcStats[item.source].total += item.unitPrice || 0;
        });

        setSourceStats(srcStats);
        setStats({
          total: data.length,
          categories,
          avgPrice,
          minPrice,
          maxPrice,
          lastUpdated: new Date(
            Math.max(...data.map((item) => new Date(item.lastVerified)))
          ),
        });
      } else {
        setSourceStats({});
        setStats({
          total: 0,
          categories: 0,
          avgPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          lastUpdated: null,
        });
      }
    } catch (error) {
      console.error("Error searching prices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
  }, [query, categoryFilter, sourceFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowSelect = (itemId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    const newSelected = new Set();
    if (selectedRows.size === results.length) {
      setSelectedRows(newSelected);
    } else {
      results.forEach((item) => newSelected.add(item._id));
      setSelectedRows(newSelected);
    }
  };

  const handleOpenDetails = (item) => {
    setSelectedItem(item);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false);
    setSelectedItem(null);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      itemName: item.itemName || "",
      category: item.category || "",
      unitPrice: item.unitPrice || "",
      unit: item.unit || "",
      source: item.source || "",
      itemCode: item.itemCode || "",
      description: item.description || "",
    });
    setOpenEditDialog(true);
  };

  const handleCloseEdit = () => {
    setOpenEditDialog(false);
    setEditingItem(null);
    setEditForm({
      itemName: "",
      category: "",
      unitPrice: "",
      unit: "",
      source: "",
      itemCode: "",
      description: "",
    });
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(`${apiUrl}/api/prices/update`, {
        prices: [
          {
            ...editForm,
            _id: editingItem._id,
            unitPrice: parseFloat(editForm.unitPrice),
          },
        ],
      });

      if (response.data.success) {
        handleCloseEdit();
        showSnackbar("✅ Price item updated successfully!", "success");
        search();
      }
    } catch (error) {
      console.error("Error updating price:", error);
      showSnackbar("❌ Failed to update price item", "error");
    }
  };

  const handleOpenDelete = (item) => {
    setSelectedItem(item);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setSelectedItem(null);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await axios.delete(
        `${apiUrl}/api/prices/${selectedItem._id}`
      );

      if (response.data.success) {
        handleCloseDelete();
        showSnackbar("🗑️ Price item deleted successfully!", "success");
        search();
      }
    } catch (error) {
      console.error("Error deleting price:", error);
      showSnackbar("❌ Failed to delete price item", "error");
    }
  };

  const handleOpenBulkDelete = () => {
    setOpenBulkDeleteDialog(true);
  };

  const handleCloseBulkDelete = () => {
    setOpenBulkDeleteDialog(false);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedRows).map((id) =>
        axios.delete(`${apiUrl}/api/prices/${id}`)
      );

      await Promise.all(deletePromises);

      handleCloseBulkDelete();
      setSelectedRows(new Set());
      showSnackbar(
        `🗑️ ${selectedRows.size} items deleted successfully!`,
        "success"
      );
      search();
    } catch (error) {
      console.error("Error deleting selected prices:", error);
      showSnackbar("❌ Failed to delete selected items", "error");
    }
  };

  const handleOpenAdd = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAdd = () => {
    setOpenAddDialog(false);
    setAddForm({
      itemName: "",
      category: "",
      unitPrice: "",
      unit: "",
      source: "CPWD_SOR",
      itemCode: "",
      description: "",
      sourceUrl: "",
      ircReference: [],
    });
  };

  const handleSaveAdd = async () => {
    try {
      if (!addForm.itemName || !addForm.unitPrice) {
        showSnackbar("❌ Item name and unit price are required", "error");
        return;
      }

      const response = await axios.post(`${apiUrl}/api/prices/add`, {
        ...addForm,
        unitPrice: parseFloat(addForm.unitPrice),
        ircReference: addForm.ircReference.filter((ref) => ref.trim() !== ""),
      });

      if (response.data.success) {
        handleCloseAdd();
        showSnackbar("✅ Price item added successfully!", "success");
        search();
      }
    } catch (error) {
      console.error("Error adding price:", error);
      showSnackbar("❌ Failed to add price item", "error");
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const escapeCSVField = (field) => {
      if (field == null) return "";
      const stringField = String(field);
      if (
        stringField.includes(",") ||
        stringField.includes('"') ||
        stringField.includes("\n") ||
        stringField.includes("\r")
      ) {
        return '"' + stringField.replace(/"/g, '""') + '"';
      }
      return stringField;
    };

    const formatDateForCSV = (date) => {
      if (!date) return "N/A";
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "Invalid Date";
        return d.toLocaleDateString("en-IN");
      } catch (error) {
        return "Invalid Date";
      }
    };

    const headers = [
      "Item Name",
      "Category",
      "Unit Price",
      "Unit",
      "Source",
      "IRC References",
      "Updated",
    ];

    const rows = results.map((item) => [
      item.itemName + (item.itemCode ? ` (Code: ${item.itemCode})` : ""),
      item.category || "General",
      item.unitPrice
        ? `₹${Number(item.unitPrice).toLocaleString("en-IN")}`
        : "₹0",
      item.unit || "N/A",
      item.source || "",
      item.ircReference ? item.ircReference.join("; ") : "",
      formatDateForCSV(item.lastVerified),
    ]);

    const csvContent = [
      headers.map(escapeCSVField).join(","),
      ...rows.map((row) => row.map(escapeCSVField).join(",")),
    ].join("\n");

    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `price_data_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box className="fade-in" sx={{ px: { xs: 1, sm: 2, md: 0 } }}>
      <Box
        sx={{
          mb: { xs: 3, sm: 4 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: "1.75rem", sm: "2.125rem", md: "2.25rem" },
            }}
          >
            💰 Price Management Dashboard
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            Manage material costs from CPWD SOR, GeM Portal, and other official
            sources
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: { xs: 1, sm: 1.5 },
            flexDirection: { xs: "column", sm: "row" },
            width: { xs: "100%", sm: "auto" },
            alignItems: { xs: "center", sm: "flex-start" },
          }}
        >
          <Tooltip title="Refresh prices">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              startIcon={<RefreshIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
              sx={{
                bgcolor: "rgba(16, 185, 129, 0.1)",
                color: "primary.main",
                "&:hover": { bgcolor: "rgba(16, 185, 129, 0.2)" },
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                py: { xs: 0.75, sm: 1 },
                px: { xs: 1.5, sm: 2 },
                minWidth: { xs: "auto", sm: "auto" },
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Refresh Prices
            </Button>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <Button
              variant="contained"
              startIcon={<GetAppIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
              onClick={exportToCSV}
              disabled={results.length === 0}
              sx={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                fontSize: { xs: "0.875rem", sm: "0.95rem" },
                py: { xs: 1, sm: 1 },
                px: { xs: 2, sm: 3 },
                flex: { xs: 1, sm: "none" },
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                },
              }}
            >
              Export
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 2, sm: 3 },
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTab-root": {
              minWidth: { xs: 120, sm: 150 },
              fontWeight: 600,
              textTransform: "none",
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              textAlign: "center",
              py: { xs: 1.5, sm: 2 },
              px: { xs: 1, sm: 2 },
            },
            "& .MuiTabs-indicator": {
              height: { xs: 3, sm: 4 },
            },
            minHeight: { xs: 48, sm: 56 },
          }}
        >
          <Tab label="📊 Dashboard" />
          <Tab label="📋 Inventory" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
                  transition: "all 0.3s ease-in-out",
                  minHeight: 160,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: "primary.main",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", p: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        borderRadius: 2,
                        bgcolor: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      }}
                    >
                      📦
                    </Box>
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: "primary.main",
                          fontSize: { xs: "1.5rem", sm: "1.875rem" },
                        }}
                      >
                        {stats.total}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 500,
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        }}
                      >
                        Total Items
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)",
                  transition: "all 0.3s ease-in-out",
                  minHeight: 160,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: "secondary.main",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", p: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        borderRadius: 2,
                        bgcolor: "secondary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      }}
                    >
                      🏷️
                    </Box>
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: "secondary.main",
                          fontSize: { xs: "1.5rem", sm: "1.875rem" },
                        }}
                      >
                        {stats.categories}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 500,
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        }}
                      >
                        Categories
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)",
                  transition: "all 0.3s ease-in-out",
                  minHeight: 180,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: "info.main",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", p: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        borderRadius: 2,
                        bgcolor: "#3B82F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      }}
                    >
                      📅
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 500,
                          mb: 0.5,
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        }}
                      >
                        Last Updated
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#3B82F6",
                          fontWeight: 600,
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        }}
                      >
                        {stats.lastUpdated
                          ? formatDate(stats.lastUpdated)
                          : "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 4, justifyContent: "center" }}>
            {Object.entries(sourceStats).map(([source, data]) => (
              <Grid item xs={12} sm={6} md={6} key={source}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: { xs: 2, sm: 3 },
                    border: "2px solid",
                    borderColor: SOURCE_COLORS[source],
                    bgcolor:
                      "rgba(" +
                      SOURCE_COLORS[source].match(/\d+/g).join(",") +
                      ", 0.05)",
                    minHeight: 160,
                  }}
                >
                  <CardContent
                    sx={{ textAlign: "center", p: { xs: 2, sm: 3 } }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          mb: { xs: 0.5, sm: 1 },
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          fontWeight: 600,
                        }}
                      >
                        {source}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: SOURCE_COLORS[source],
                          fontSize: { xs: "1.25rem", sm: "1.5rem" },
                        }}
                      >
                        {data.count} items
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {tabValue === 1 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search by item name..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                    endAdornment: query && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setQuery("");
                            setPage(0);
                          }}
                        >
                          ✕
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  select
                  fullWidth
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Category"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          "& .MuiMenuItem-root": {
                            textAlign: "center",
                            justifyContent: "center",
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ textAlign: "center" }}>
                    All Categories
                  </MenuItem>
                  {CATEGORIES.map((cat) => (
                    <MenuItem
                      key={cat}
                      value={cat}
                      sx={{ textAlign: "center" }}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Source"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          "& .MuiMenuItem-root": {
                            textAlign: "center",
                            justifyContent: "center",
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ textAlign: "center" }}>
                    All Sources
                  </MenuItem>
                  <MenuItem value="CPWD_SOR" sx={{ textAlign: "center" }}>
                    CPWD SOR
                  </MenuItem>
                  <MenuItem value="GeM" sx={{ textAlign: "center" }}>
                    GeM
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAdd}
                  sx={{
                    background:
                      "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    fontWeight: 600,
                    py: 1.75,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    },
                    height: "56px",
                  }}
                >
                  Add Item
                </Button>
              </Grid>
            </Grid>

            {selectedRows.size > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  p: 1.5,
                  bgcolor: "rgba(16, 185, 129, 0.1)",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "primary.main",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedRows.size} item(s) selected
                </Typography>
                <Button
                  size="small"
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={handleOpenBulkDelete}
                >
                  Delete Selected
                </Button>
              </Box>
            )}
          </Box>

          {loading ? (
            <Box sx={{ p: 4 }}>
              <LinearProgress />
              <Typography
                variant="body2"
                sx={{ textAlign: "center", mt: 2, color: "text.secondary" }}
              >
                Searching price database...
              </Typography>
            </Box>
          ) : results.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                px: 3,
              }}
            >
              <StorefrontOutlinedIcon
                sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
                {query ? "No results found" : "Start searching"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {query
                  ? "Try adjusting your search terms or filters"
                  : "Enter keywords to search for material prices"}
              </Typography>
            </Box>
          ) : isMobile ? (
            <>
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={{ xs: 2, sm: 2 }}>
                  {results
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <Grid item xs={12} key={item._id}>
                        <Card
                          elevation={0}
                          sx={{
                            borderRadius: { xs: 2, sm: 3 },
                            border: "1px solid",
                            borderColor: "divider",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              borderColor: "primary.main",
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            },
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: { xs: 1.5, sm: 2 },
                              }}
                            >
                              <Checkbox
                                checked={selectedRows.has(item._id)}
                                onChange={() => handleRowSelect(item._id)}
                                sx={{ mt: 0.5, flexShrink: 0 }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    mb: { xs: 1.5, sm: 2 },
                                  }}
                                >
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontWeight: 700,
                                        mb: 0.5,
                                        fontSize: { xs: "1rem", sm: "1.1rem" },
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {item.itemName}
                                    </Typography>
                                    {item.itemCode && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "text.secondary",
                                          display: "block",
                                          fontSize: {
                                            xs: "0.75rem",
                                            sm: "0.8rem",
                                          },
                                        }}
                                      >
                                        Code: {item.itemCode}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 0.5,
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Tooltip title="View Details">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenDetails(item)}
                                        sx={{
                                          color: "primary.main",
                                          "&:hover": {
                                            bgcolor: "rgba(16, 185, 129, 0.1)",
                                          },
                                        }}
                                      >
                                        <VisibilityIcon
                                          sx={{ fontSize: { xs: 18, sm: 20 } }}
                                        />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenEdit(item)}
                                        sx={{
                                          color: "info.main",
                                          "&:hover": {
                                            bgcolor: "rgba(59, 130, 246, 0.1)",
                                          },
                                        }}
                                      >
                                        <EditIcon
                                          sx={{ fontSize: { xs: 18, sm: 20 } }}
                                        />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenDelete(item)}
                                        sx={{
                                          color: "error.main",
                                          "&:hover": {
                                            bgcolor: "rgba(239, 68, 68, 0.1)",
                                          },
                                        }}
                                      >
                                        <DeleteIcon
                                          sx={{ fontSize: { xs: 18, sm: 20 } }}
                                        />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: { xs: 1, sm: 1.5 },
                                    mb: { xs: 1.5, sm: 2 },
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 700,
                                      color: "primary.main",
                                      fontSize: { xs: "1.1rem", sm: "1.25rem" },
                                    }}
                                  >
                                    ₹
                                    {(item.unitPrice || 0).toLocaleString(
                                      "en-IN"
                                    )}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "text.secondary",
                                      fontSize: {
                                        xs: "0.8rem",
                                        sm: "0.875rem",
                                      },
                                    }}
                                  >
                                    per {item.unit || "N/A"}
                                  </Typography>
                                </Box>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: { xs: 1, sm: 1.5 },
                                    mb: { xs: 1.5, sm: 2 },
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Chip
                                    label={item.category || "General"}
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                      textTransform: "capitalize",
                                      height: { xs: 24, sm: 28 },
                                    }}
                                  />
                                  <Chip
                                    label={item.source}
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                      bgcolor:
                                        SOURCE_COLORS[item.source] + "20",
                                      color: SOURCE_COLORS[item.source],
                                      border: `1px solid ${
                                        SOURCE_COLORS[item.source]
                                      }`,
                                      height: { xs: 24, sm: 28 },
                                    }}
                                  />
                                </Box>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: { xs: 1, sm: 1.5 },
                                    mb: { xs: 1.5, sm: 2 },
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                    }}
                                  >
                                    📚 IRC:{" "}
                                    {item.ircReference &&
                                    item.ircReference.length > 0
                                      ? item.ircReference.join(", ")
                                      : "N/A"}
                                  </Typography>
                                </Box>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: { xs: 1, sm: 1.5 },
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                    }}
                                  >
                                    <UpdateIcon
                                      sx={{
                                        fontSize: {
                                          xs: "0.8rem",
                                          sm: "0.9rem",
                                        },
                                      }}
                                    />
                                    Updated:{" "}
                                    {new Date(
                                      item.lastVerified
                                    ).toLocaleDateString("en-IN")}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50, 100]}
                  component="div"
                  count={results.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{
                    "& .MuiTablePagination-toolbar": {
                      flexWrap: "wrap",
                      justifyContent: "center",
                    },
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                      {
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      },
                  }}
                />
              </Box>
            </>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "rgba(16, 185, 129, 0.05)" }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRows.size === results.length}
                          onChange={handleSelectAll}
                          indeterminate={
                            selectedRows.size > 0 &&
                            selectedRows.size < results.length
                          }
                        />
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                      >
                        Item Name
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                      >
                        Category
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                      >
                        Unit Price
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                      >
                        Unit
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                      >
                        Source
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                      >
                        IRC References
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                      >
                        Updated
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((item) => (
                        <TableRow
                          key={item._id}
                          hover
                          selected={selectedRows.has(item._id)}
                          sx={{
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              bgcolor: "rgba(45, 95, 63, 0.08)",
                            },
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedRows.has(item._id)}
                              onChange={() => handleRowSelect(item._id)}
                            />
                          </TableCell>

                          <TableCell align="center" sx={{ py: 2.5 }}>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700, mb: 0.25 }}
                              >
                                {item.itemName}
                              </Typography>
                              {item.itemCode && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    display: "block",
                                  }}
                                >
                                  Code: {item.itemCode}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              label={item.category || "General"}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                textTransform: "capitalize",
                              }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: "primary.main",
                                fontSize: "0.9rem",
                              }}
                            >
                              ₹{(item.unitPrice || 0).toLocaleString("en-IN")}
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              label={item.unit || "N/A"}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              label={item.source}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                bgcolor: SOURCE_COLORS[item.source] + "20",
                                color: SOURCE_COLORS[item.source],
                                border: `1px solid ${
                                  SOURCE_COLORS[item.source]
                                }`,
                              }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            {item.ircReference &&
                            item.ircReference.length > 0 ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 0.5,
                                  flexWrap: "wrap",
                                  justifyContent: "center",
                                }}
                              >
                                {item.ircReference
                                  .slice(0, 2)
                                  .map((ref, idx) => (
                                    <Chip
                                      key={idx}
                                      label={ref}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        fontSize: "0.65rem",
                                        height: "20px",
                                      }}
                                    />
                                  ))}
                                {item.ircReference.length > 2 && (
                                  <Chip
                                    label={`+${item.ircReference.length - 2}`}
                                    size="small"
                                    sx={{ fontSize: "0.65rem", height: "20px" }}
                                  />
                                )}
                              </Box>
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontSize: "0.7rem",
                                }}
                              >
                                N/A
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell align="center">
                            <Tooltip
                              title={formatDate(item.lastVerified)}
                              placement="top"
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 0.25,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    color: "text.secondary",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  <UpdateIcon sx={{ fontSize: "0.8rem" }} />
                                  {new Date(
                                    item.lastVerified
                                  ).toLocaleDateString("en-IN")}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    fontSize: "0.7rem",
                                    fontWeight: 500,
                                  }}
                                >
                                  {new Date(
                                    item.lastVerified
                                  ).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>

                          <TableCell align="center">
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDetails(item)}
                                  sx={{
                                    color: "primary.main",
                                    "&:hover": {
                                      bgcolor: "rgba(16, 185, 129, 0.1)",
                                    },
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEdit(item)}
                                  sx={{
                                    color: "info.main",
                                    "&:hover": {
                                      bgcolor: "rgba(59, 130, 246, 0.1)",
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDelete(item)}
                                  sx={{
                                    color: "error.main",
                                    "&:hover": {
                                      bgcolor: "rgba(239, 68, 68, 0.1)",
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50, 100]}
                  component="div"
                  count={results.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                />
              </Box>
            </>
          )}
        </Paper>
      )}

      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
      >
        {selectedItem && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 700,
                fontSize: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: 1,
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              📋 Item Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ pt: 2 }}>
                <Grid item xs={4} sx={{ textAlign: "center" }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Item Name
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {selectedItem.itemName}
                    </Typography>
                  </Box>
                </Grid>

                {selectedItem.itemCode && (
                  <Grid item xs={4} sx={{ textAlign: "center" }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        Item Code
                      </Typography>
                      <Chip
                        label={selectedItem.itemCode}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                )}

                <Grid item xs={4} sx={{ textAlign: "center" }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Price
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "primary.main" }}
                    >
                      ₹{(selectedItem.unitPrice || 0).toLocaleString("en-IN")}{" "}
                      per {selectedItem.unit}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={4} sx={{ textAlign: "center" }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Category
                    </Typography>
                    <Chip
                      label={selectedItem.category}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={4} sx={{ textAlign: "center" }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Source
                    </Typography>
                    <Chip
                      label={selectedItem.source}
                      size="small"
                      sx={{
                        bgcolor: SOURCE_COLORS[selectedItem.source] + "20",
                        color: SOURCE_COLORS[selectedItem.source],
                        border: `1px solid ${
                          SOURCE_COLORS[selectedItem.source]
                        }`,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Grid>

                {selectedItem.ircReference &&
                  selectedItem.ircReference.length > 0 && (
                    <Grid item xs={4} sx={{ textAlign: "center" }}>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 600,
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          IRC References
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            justifyContent: "center",
                          }}
                        >
                          {selectedItem.ircReference.map((ref, idx) => (
                            <Chip key={idx} label={ref} size="small" />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  )}

                <Grid item xs={4} sx={{ textAlign: "center" }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Timestamps
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Added: {formatDate(selectedItem.createdAt)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
                    >
                      Last Updated: {formatDate(selectedItem.lastVerified)}
                    </Typography>
                  </Box>
                </Grid>

                {selectedItem.description && (
                  <Grid item xs={4} sx={{ textAlign: "center" }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        Description
                      </Typography>
                      <Typography variant="body2">
                        {selectedItem.description}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center" }}>
              <Button onClick={handleCloseDetails} variant="outlined">
                Close
              </Button>
              <Button
                onClick={handleCloseDetails}
                variant="contained"
                startIcon={<EditIcon />}
              >
                Edit Item
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={openEditDialog}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          ✏️ Edit Price Item
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Box
            sx={{
              pt: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              fullWidth
              label="Item Name"
              value={editForm.itemName}
              onChange={(e) =>
                setEditForm({ ...editForm, itemName: e.target.value })
              }
              sx={{ maxWidth: 400 }}
            />
            <TextField
              fullWidth
              label="Category"
              value={editForm.category}
              onChange={(e) =>
                setEditForm({ ...editForm, category: e.target.value })
              }
              sx={{ maxWidth: 400 }}
            />
            <TextField
              fullWidth
              label="Unit Price"
              type="number"
              value={editForm.unitPrice}
              onChange={(e) =>
                setEditForm({ ...editForm, unitPrice: e.target.value })
              }
              sx={{ maxWidth: 400 }}
            />
            <TextField
              fullWidth
              label="Unit"
              value={editForm.unit}
              onChange={(e) =>
                setEditForm({ ...editForm, unit: e.target.value })
              }
              sx={{ maxWidth: 400 }}
            />
            <TextField
              select
              fullWidth
              label="Source"
              value={editForm.source}
              onChange={(e) =>
                setEditForm({ ...editForm, source: e.target.value })
              }
              sx={{ maxWidth: 400 }}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      "& .MuiMenuItem-root": {
                        textAlign: "center",
                        justifyContent: "center",
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="CPWD_SOR" sx={{ textAlign: "center" }}>
                CPWD SOR
              </MenuItem>
              <MenuItem value="GeM" sx={{ textAlign: "center" }}>
                GeM
              </MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Item Code"
              value={editForm.itemCode}
              onChange={(e) =>
                setEditForm({ ...editForm, itemCode: e.target.value })
              }
              sx={{ maxWidth: 400 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              sx={{ maxWidth: 400 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={handleCloseEdit} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          🗑️ Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this price item?
          </Typography>
          {selectedItem && (
            <Box
              sx={{ p: 2, bgcolor: "rgba(239, 68, 68, 0.1)", borderRadius: 2 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {selectedItem.itemName}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {selectedItem.category} • ₹
                {selectedItem.unitPrice?.toLocaleString("en-IN")}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={handleCloseDelete} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openBulkDeleteDialog}
        onClose={handleCloseBulkDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          🗑️ Confirm Bulk Delete
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete {selectedRows.size} selected price
            items?
          </Typography>
          <Box
            sx={{ p: 2, bgcolor: "rgba(239, 68, 68, 0.1)", borderRadius: 2 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              This action cannot be undone.
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {selectedRows.size} items will be permanently removed from the
              database.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={handleCloseBulkDelete} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBulkDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete All Selected
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAddDialog}
        onClose={handleCloseAdd}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          ➕ Add New Price Item
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Box
            sx={{
              pt: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              fullWidth
              label="Item Name *"
              value={addForm.itemName}
              onChange={(e) =>
                setAddForm({ ...addForm, itemName: e.target.value })
              }
              sx={{ maxWidth: 400 }}
              required
            />
            <TextField
              fullWidth
              label="Category"
              value={addForm.category}
              onChange={(e) =>
                setAddForm({ ...addForm, category: e.target.value })
              }
              sx={{ maxWidth: 400 }}
              placeholder="e.g., signage, marking, barrier"
            />
            <TextField
              fullWidth
              label="Unit Price (₹) *"
              type="number"
              value={addForm.unitPrice}
              onChange={(e) =>
                setAddForm({ ...addForm, unitPrice: e.target.value })
              }
              sx={{ maxWidth: 400 }}
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
              }}
            />
            <TextField
              fullWidth
              label="Unit"
              value={addForm.unit}
              onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
              sx={{ maxWidth: 400 }}
              placeholder="e.g., sqm, kg, nos, m"
            />
            <TextField
              select
              fullWidth
              label="Source"
              value={addForm.source}
              onChange={(e) =>
                setAddForm({ ...addForm, source: e.target.value })
              }
              sx={{ maxWidth: 400 }}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      "& .MuiMenuItem-root": {
                        textAlign: "center",
                        justifyContent: "center",
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="CPWD_SOR" sx={{ textAlign: "center" }}>
                CPWD SOR
              </MenuItem>
              <MenuItem value="GeM" sx={{ textAlign: "center" }}>
                GeM
              </MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Item Code"
              value={addForm.itemCode}
              onChange={(e) =>
                setAddForm({ ...addForm, itemCode: e.target.value })
              }
              sx={{ maxWidth: 400 }}
              placeholder="Optional item code or reference"
            />
            <TextField
              fullWidth
              label="Source URL"
              value={addForm.sourceUrl}
              onChange={(e) =>
                setAddForm({ ...addForm, sourceUrl: e.target.value })
              }
              sx={{ maxWidth: 400 }}
              placeholder="https://..."
            />
            <TextField
              fullWidth
              label="IRC References"
              value={addForm.ircReference.join(", ")}
              onChange={(e) =>
                setAddForm({
                  ...addForm,
                  ircReference: e.target.value
                    .split(",")
                    .map((ref) => ref.trim())
                    .filter((ref) => ref !== ""),
                })
              }
              sx={{ maxWidth: 400 }}
              placeholder="IRC section references (comma separated)"
              helperText="e.g., IRC 15-2017, IRC SP 79-2018"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={addForm.description}
              onChange={(e) =>
                setAddForm({ ...addForm, description: e.target.value })
              }
              sx={{ maxWidth: 400 }}
              placeholder="Detailed description of the item"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={handleCloseAdd} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSaveAdd}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            }}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          mt: { xs: 4, sm: 6 },
          p: { xs: 2, sm: 3 },
          borderRadius: { xs: 2, sm: 3 },
          bgcolor:
            "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%)",
          border: "1px solid",
          borderColor: "rgba(16, 185, 129, 0.2)",
          textAlign: "center",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: "1rem", sm: "1.1rem" },
          }}
        >
          🔗 Integrated Data Sources
        </Typography>
        <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  mb: 0.5,
                  fontSize: { xs: "0.9rem", sm: "0.95rem" },
                }}
              >
                CPWD SOR
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.75rem", sm: "0.8rem" },
                  lineHeight: 1.4,
                }}
              >
                Central Public Works Department Schedule of Rates - Official
                government rates for construction materials
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  mb: 0.5,
                  fontSize: { xs: "0.9rem", sm: "0.95rem" },
                }}
              >
                GeM Portal
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.75rem", sm: "0.8rem" },
                  lineHeight: 1.4,
                }}
              >
                Government e-Marketplace - Real-time pricing data from approved
                vendors
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
