import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  fetchRecommendationHistory,
  fetchRecommendationDetail,
  updateRecommendationStatus,
  deleteRecommendation,
} from "../services/interventionService";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import RefreshIcon from "@mui/icons-material/Refresh";

const statusColorMap = {
  generated: {
    bg: "rgba(96, 125, 255, 0.1)",
    text: "#607DFF",
    label: "Generated",
  },
  reviewed: {
    bg: "rgba(245, 158, 11, 0.1)",
    text: "#F59E0B",
    label: "Reviewed",
  },
  approved: {
    bg: "rgba(34, 197, 94, 0.1)",
    text: "#22C55E",
    label: "Approved",
  },
  rejected: {
    bg: "rgba(239, 68, 68, 0.1)",
    text: "#EF4444",
    label: "Rejected",
  },
};

const priorityColorMap = {
  low: { bg: "rgba(100, 116, 139, 0.1)", text: "#64748B" },
  medium: { bg: "rgba(245, 158, 11, 0.1)", text: "#F59E0B" },
  high: { bg: "rgba(239, 68, 68, 0.1)", text: "#EF4444" },
  critical: { bg: "rgba(139, 0, 0, 0.2)", text: "#DC2626" },
};

export default function RecommendationHistory() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItemId, setMenuItemId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;

      const response = await fetchRecommendationHistory(params);
      setRecommendations(response.data || []);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await fetchRecommendationDetail(id);
      setSelectedDetail(response.data);
    } catch (error) {
      console.error("Failed to load detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedDetail(null);
  };

  const handleMenuOpen = (event, id) => {
    setAnchorEl(event.currentTarget);
    setMenuItemId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuItemId(null);
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateRecommendationStatus(menuItemId, { status: newStatus });
      loadHistory();
      handleMenuClose();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this recommendation?")
    ) {
      try {
        await deleteRecommendation(id);
        loadHistory();
      } catch (error) {
        console.error("Failed to delete:", error);
      }
    }
  };

  const handleExportPDF = (record) => {
    const content = `
ROAD SAFETY INTERVENTION RECOMMENDATION REPORT
Generated: ${new Date(record.createdAt).toLocaleString()}

CONTEXT:
Road Type: ${record.roadType || "-"}
Environment: ${record.environment || "-"}
Traffic Volume: ${record.trafficVolume || "-"}
Operating Speed: ${record.speedLimit || "-"}
Issues: ${record.issues.join(", ") || "-"}

PROBLEM DESCRIPTION:
${record.problemDescription || "-"}

RECOMMENDATIONS:
${record.recommendations
  .map(
    (rec, idx) => `
${idx + 1}. ${rec.title}
   Confidence: ${rec.confidence}
   IRC Reference: ${rec.ircReference.code} Clause ${rec.ircReference.clause}
   Action: ${rec.recommendedAction}
   Justification: ${rec.justification}
`
  )
  .join("\n")}

SUPPORTING NOTES:
${record.supportingNotes || "-"}

FOLLOW-UP QUESTIONS:
${record.followUpQuestions.map((q) => `- ${q}`).join("\n") || "-"}

STATUS: ${statusColorMap[record.status].label}
PRIORITY: ${record.priority}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recommendation-${record._id}.txt`;
    a.click();
  };

  return (
    <Box sx={{ color: "white", pb: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Recommendation History
          </Typography>
          <Typography variant="body2" sx={{ color: "#94A3B8" }}>
            View, manage, and review all generated road safety recommendations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadHistory}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <Card
        sx={{
          bgcolor: "rgba(15,23,42,0.8)",
          border: "1px solid rgba(148,163,184,0.1)",
          backdropFilter: "blur(6px)",
          mb: 3,
        }}
      >
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Status"
                select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                fullWidth
                variant="filled"
                InputProps={{ sx: { color: "white" } }}
                InputLabelProps={{ sx: { color: "#94A3B8" } }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="generated">Generated</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Category"
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                fullWidth
                placeholder="e.g. Road Sign"
                variant="filled"
                InputProps={{ sx: { color: "white" } }}
                InputLabelProps={{ sx: { color: "#94A3B8" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Priority"
                select
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
                fullWidth
                variant="filled"
                InputProps={{ sx: { color: "white" } }}
                InputLabelProps={{ sx: { color: "#94A3B8" } }}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : recommendations.length === 0 ? (
        <Card
          sx={{
            bgcolor: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(148,163,184,0.1)",
            textAlign: "center",
            py: 6,
          }}
        >
          <Typography sx={{ color: "#94A3B8" }}>
            No recommendations found. Try adjusting your filters.
          </Typography>
        </Card>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(148,163,184,0.1)",
            backdropFilter: "blur(6px)",
            borderRadius: 2,
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(15,23,42,0.5)" }}>
                <TableCell sx={{ color: "#E2E8F0", fontWeight: 700 }}>
                  Date
                </TableCell>
                <TableCell sx={{ color: "#E2E8F0", fontWeight: 700 }}>
                  Problem
                </TableCell>
                <TableCell sx={{ color: "#E2E8F0", fontWeight: 700 }}>
                  Category
                </TableCell>
                <TableCell sx={{ color: "#E2E8F0", fontWeight: 700 }}>
                  Status
                </TableCell>
                <TableCell sx={{ color: "#E2E8F0", fontWeight: 700 }}>
                  Priority
                </TableCell>
                <TableCell sx={{ color: "#E2E8F0", fontWeight: 700 }}>
                  Recommendations
                </TableCell>
                <TableCell sx={{ color: "#E2E8F0", fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recommendations.map((rec, idx) => (
                <TableRow
                  key={rec._id}
                  sx={{
                    bgcolor:
                      idx % 2 === 0 ? "transparent" : "rgba(15,23,42,0.3)",
                    "&:hover": { bgcolor: "rgba(16, 185, 129, 0.05)" },
                  }}
                >
                  <TableCell sx={{ color: "#CBD5F5" }}>
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ color: "#CBD5F5", maxWidth: 150 }}>
                    <Typography variant="body2" noWrap>
                      {rec.problemDescription?.substring(0, 40)}...
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "#CBD5F5" }}>
                    {rec.category || "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusColorMap[rec.status]?.label || rec.status}
                      size="small"
                      sx={{
                        bgcolor: statusColorMap[rec.status]?.bg,
                        color: statusColorMap[rec.status]?.text,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rec.priority}
                      size="small"
                      sx={{
                        bgcolor: priorityColorMap[rec.priority]?.bg,
                        color: priorityColorMap[rec.priority]?.text,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#CBD5F5" }}>
                    {rec.recommendations?.length || 0} recommendation(s)
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDetail(rec._id)}
                          sx={{ color: "#10B981" }}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Options">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, rec._id)}
                          sx={{ color: "#94A3B8" }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusUpdate("reviewed")}>
          Mark Reviewed
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate("approved")}>
          Approve
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate("rejected")}>
          Reject
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            const record = recommendations.find((r) => r._id === menuItemId);
            if (record) handleExportPDF(record);
            handleMenuClose();
          }}
        >
          Export as Text
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleDelete(menuItemId);
            handleMenuClose();
          }}
          sx={{ color: "#EF4444" }}
        >
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(15,23,42,0.95)",
            backgroundImage:
              "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 100%)",
            border: "1px solid rgba(94,234,212,0.2)",
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#5EEAD4",
            fontWeight: 700,
            borderBottom: "1px solid rgba(94,234,212,0.2)",
          }}
        >
          Recommendation Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedDetail ? (
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#E2E8F0", mb: 1 }}
                >
                  Request Context
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                      Road Type
                    </Typography>
                    <Typography sx={{ color: "#CBD5F5" }}>
                      {selectedDetail.roadType || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                      Environment
                    </Typography>
                    <Typography sx={{ color: "#CBD5F5" }}>
                      {selectedDetail.environment || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                      Traffic Volume
                    </Typography>
                    <Typography sx={{ color: "#CBD5F5" }}>
                      {selectedDetail.trafficVolume || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                      Operating Speed
                    </Typography>
                    <Typography sx={{ color: "#CBD5F5" }}>
                      {selectedDetail.speedLimit || "-"}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ borderColor: "rgba(148,163,184,0.1)" }} />

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#E2E8F0", mb: 1 }}
                >
                  Problem Description
                </Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                  {selectedDetail.problemDescription || "-"}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "rgba(148,163,184,0.1)" }} />

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#5EEAD4", mb: 2 }}
                >
                  Recommendations ({selectedDetail.recommendations?.length || 0}
                  )
                </Typography>
                <Stack spacing={2}>
                  {(selectedDetail.recommendations || []).map((rec, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        border: "1px solid rgba(94,234,212,0.25)",
                        borderRadius: 2,
                        p: 2,
                        bgcolor: "rgba(94,234,212,0.05)",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        mb={1}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ color: "#E2E8F0", flex: 1 }}
                        >
                          {rec.title}
                        </Typography>
                        <Chip
                          label={rec.confidence}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Stack>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", display: "block", mb: 1 }}
                      >
                        {rec.ircReference?.code} | Clause{" "}
                        {rec.ircReference?.clause}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "#CBD5F5", mb: 1 }}
                      >
                        {rec.recommendedAction}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                        {rec.justification}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ borderColor: "rgba(148,163,184,0.1)" }} />

              {selectedDetail.supportingNotes && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: "#E2E8F0", mb: 1 }}
                  >
                    Supporting Notes
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                    {selectedDetail.supportingNotes}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{ display: "flex", gap: 2, alignItems: "center", pt: 2 }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                    Status
                  </Typography>
                  <Chip
                    label={statusColorMap[selectedDetail.status]?.label}
                    sx={{
                      bgcolor: statusColorMap[selectedDetail.status]?.bg,
                      color: statusColorMap[selectedDetail.status]?.text,
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                    Priority
                  </Typography>
                  <Chip
                    label={selectedDetail.priority}
                    sx={{
                      bgcolor: priorityColorMap[selectedDetail.priority]?.bg,
                      color: priorityColorMap[selectedDetail.priority]?.text,
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  />
                </Box>
              </Box>

              <Button
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                fullWidth
                sx={{
                  borderColor: "rgba(94,234,212,0.5)",
                  color: "#5EEAD4",
                  "&:hover": {
                    borderColor: "#5EEAD4",
                    bgcolor: "rgba(94,234,212,0.1)",
                  },
                }}
                onClick={() => {
                  handleExportPDF(selectedDetail);
                  handleCloseDetail();
                }}
              >
                Export Report
              </Button>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
