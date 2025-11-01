import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Collapse,
  Pagination,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  generateRecommendations,
  fetchRecommendationHistory,
} from "../services/interventionService";
import HistoryIcon from "@mui/icons-material/History";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CloseIcon from "@mui/icons-material/Close";

const defaultForm = {
  roadType: "",
  environment: "",
  trafficVolume: "",
  speedLimit: "",
  issues: [],
  problemDescription: "",
  constraints: "",
  additionalNotes: "",
  category: "",
};

const presetIssues = [
  "Damaged signage",
  "Missing signage",
  "Visibility",
  "Spacing",
  "Improper placement",
  "Speed management",
  "Hospital zone",
];

export default function RoadSafetyGPT() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [form, setForm] = useState(defaultForm);
  const [customIssue, setCustomIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAddIssue = () => {
    const value = customIssue.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      issues: Array.from(new Set([...(prev.issues || []), value])),
    }));
    setCustomIssue("");
  };

  const handleRemoveIssue = (issue) => {
    setForm((prev) => ({
      ...prev,
      issues: prev.issues.filter((item) => item !== issue),
    }));
  };

  const handleSelectPreset = (issue) => {
    setForm((prev) => ({
      ...prev,
      issues: Array.from(new Set([...(prev.issues || []), issue])),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        ...form,
        issues: form.issues,
      };
      const response = await generateRecommendations(payload);

      if (!response.success) {
        throw new Error(
          response.message || "Failed to generate recommendations"
        );
      }

      setResult(response.data);
    } catch (err) {
      console.error("Failed to generate interventions", err);
      setError(err.message || "Unable to generate recommendations right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async (page = 1) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setCurrentPage(page);
    try {
      const response = await fetchRecommendationHistory({
        limit: 5,
        skip: (page - 1) * 5,
      });
      setHistory(response.data || []);
      setTotalPages(Math.ceil((response.total || 0) / 5));
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handlePageChange = (event, page) => {
    handleOpenHistory(page);
  };

  return (
    <Box sx={{ color: "white" }}>
      <Stack direction="column" alignItems="center" spacing={2} mb={4}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            justifyContent: "center",
            flexWrap: "wrap",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              textAlign: "center",
              width: "100%",
            }}
          >
            Road Safety Intervention GPT
          </Typography>
          <Tooltip title="The assistant searches the curated intervention database, provides candidate matches, and uses the Gemini model to craft context-aware recommendations with IRC references and reasoning.">
            <IconButton size="small" sx={{ color: "#94A3B8" }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Typography
          variant="body1"
          sx={{
            color: "#94A3B8",
            textAlign: "center",
            maxWidth: 600,
            px: { xs: 2, sm: 0 },
          }}
        >
          Provide site context and the tool will match interventions from the
          curated database and explain the rationale with IRC references.
        </Typography>
        <Tooltip title="View Past Recommendations">
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={handleOpenHistory}
            sx={{
              borderColor: "rgba(148,163,184,0.3)",
              color: "#94A3B8",
              "&:hover": {
                borderColor: "#10B981",
                color: "#10B981",
                bgcolor: "rgba(16, 185, 129, 0.05)",
              },
            }}
          >
            View History
          </Button>
        </Tooltip>
      </Stack>
      {result ? (
        <Grid container spacing={3} component="form" onSubmit={handleSubmit}>
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                bgcolor: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(148,163,184,0.1)",
                backdropFilter: "blur(6px)",
              }}
            >
              <CardContent>
                <Stack spacing={3}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Road Type"
                      value={form.roadType}
                      onChange={handleFieldChange("roadType")}
                      placeholder="e.g. Divided Urban Arterial"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                    <TextField
                      label="Environment"
                      value={form.environment}
                      onChange={handleFieldChange("environment")}
                      placeholder="e.g. Hospital zone, Mixed land use"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Traffic Volume"
                      value={form.trafficVolume}
                      onChange={handleFieldChange("trafficVolume")}
                      placeholder="e.g. 22000 PCU/day"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                    <TextField
                      label="Operating Speed"
                      value={form.speedLimit}
                      onChange={handleFieldChange("speedLimit")}
                      placeholder="e.g. 60 km/h"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                  </Stack>

                  <TextField
                    label="Detailed Problem Description"
                    value={form.problemDescription}
                    onChange={handleFieldChange("problemDescription")}
                    placeholder="Describe the safety issue, observed conflicts, crash history, etc."
                    multiline
                    minRows={4}
                    variant="filled"
                    fullWidth
                    InputProps={{ sx: { color: "white" } }}
                    InputLabelProps={{ sx: { color: "#94A3B8" } }}
                  />

                  <TextField
                    label="Constraints / Implementation Notes"
                    value={form.constraints}
                    onChange={handleFieldChange("constraints")}
                    placeholder="Right-of-way limits, budget constraints, stakeholder feedback"
                    multiline
                    minRows={3}
                    variant="filled"
                    fullWidth
                    InputProps={{ sx: { color: "white" } }}
                    InputLabelProps={{ sx: { color: "#94A3B8" } }}
                  />

                  <Stack spacing={2}>
                    <Typography variant="subtitle1" sx={{ color: "#E2E8F0" }}>
                      Safety Issues
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {form.issues.map((issue) => (
                        <Chip
                          key={issue}
                          label={issue}
                          onDelete={() => handleRemoveIssue(issue)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Add Issue"
                        value={customIssue}
                        onChange={(event) => setCustomIssue(event.target.value)}
                        placeholder="Type and press add"
                        fullWidth
                        variant="filled"
                        InputProps={{ sx: { color: "white" } }}
                        InputLabelProps={{ sx: { color: "#94A3B8" } }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddIssue}
                        sx={{ minWidth: 120 }}
                      >
                        Add
                      </Button>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {presetIssues.map((issue) => (
                        <Chip
                          key={issue}
                          label={issue}
                          onClick={() => handleSelectPreset(issue)}
                          variant="outlined"
                          sx={{ cursor: "pointer" }}
                        />
                      ))}
                    </Stack>
                  </Stack>

                  <TextField
                    label="Additional Notes"
                    value={form.additionalNotes}
                    onChange={handleFieldChange("additionalNotes")}
                    placeholder="Crash locations, stakeholder priorities, design horizon"
                    multiline
                    minRows={3}
                    variant="filled"
                    fullWidth
                    InputProps={{ sx: { color: "white" } }}
                    InputLabelProps={{ sx: { color: "#94A3B8" } }}
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Filter By Category (optional)"
                      value={form.category}
                      onChange={handleFieldChange("category")}
                      placeholder="e.g. Road Sign"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ minWidth: { xs: "100%", sm: 200 }, height: 56 }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Generate"
                        )}
                      </Button>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error" onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              {result && (
                <Card
                  sx={{
                    bgcolor: "rgba(15,23,42,0.8)",
                    border: "1px solid rgba(94,234,212,0.25)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      p: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#5EEAD4",
                        mb: 2,
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    >
                      Recommended Interventions
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        "&::-webkit-scrollbar": {
                          width: "6px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "rgba(15,23,42,0.3)",
                          borderRadius: "3px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: "rgba(94,234,212,0.3)",
                          borderRadius: "3px",
                          "&:hover": {
                            background: "rgba(94,234,212,0.5)",
                          },
                        },
                      }}
                    >
                      <Stack spacing={2}>
                        {(result.recommendations || []).map((item) => (
                          <Box
                            key={item.sourceId}
                            sx={{
                              border: "1px solid rgba(94,234,212,0.25)",
                              borderRadius: 2,
                              p: 2,
                              bgcolor: "rgba(15,23,42,0.4)",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              justifyContent="center"
                              mb={1}
                              flexWrap="wrap"
                              gap={1}
                            >
                              <Chip
                                label={item.confidence || "-"}
                                size="small"
                                color={
                                  item.confidence === "High"
                                    ? "error"
                                    : item.confidence === "Medium"
                                    ? "warning"
                                    : item.confidence === "Low"
                                    ? "success"
                                    : "default"
                                }
                              />
                              <Chip
                                label={`${
                                  item.ircReference?.code || ""
                                } | Clause ${item.ircReference?.clause || ""}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  color: "#5EEAD4",
                                  borderColor: "rgba(94,234,212,0.25)",
                                }}
                              />
                            </Stack>
                            <Typography
                              variant="subtitle1"
                              fontWeight={600}
                              gutterBottom
                              sx={{ textAlign: "center", color: "#E2E8F0" }}
                            >
                              {item.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#CBD5F5" }}
                              gutterBottom
                            >
                              {item.recommendedAction}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#94A3B8" }}
                              gutterBottom
                            >
                              {item.justification}
                            </Typography>
                            {item.matchingFactors &&
                              item.matchingFactors.length > 0 && (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#64748B" }}
                                >
                                  Matching Factors:{" "}
                                  {item.matchingFactors.join(", ")}
                                </Typography>
                              )}
                            {item.followUp && item.followUp.length > 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  color: "#64748B",
                                  mt: 0.5,
                                }}
                              >
                                Follow-up: {item.followUp.join(", ")}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>

                      {result.supportingNotes && (
                        <Box sx={{ mt: 3 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ color: "#E2E8F0", textAlign: "center" }}
                          >
                            Supporting Notes
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                            {result.supportingNotes}
                          </Typography>
                        </Box>
                      )}

                      {result.followUpQuestions &&
                        result.followUpQuestions.length > 0 && (
                          <Box sx={{ mt: 3 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ color: "#E2E8F0", textAlign: "center" }}
                            >
                              Follow-up Questions
                            </Typography>
                            <Stack spacing={1}>
                              {result.followUpQuestions.map((question, idx) => (
                                <Typography
                                  key={idx}
                                  variant="body2"
                                  sx={{ color: "#94A3B8" }}
                                >
                                  • {question}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                        )}

                      {result.candidateSnapshot &&
                        result.candidateSnapshot.length > 0 && (
                          <Box sx={{ mt: 3 }}>
                            <Divider
                              sx={{
                                borderColor: "rgba(148,163,184,0.2)",
                                mb: 2,
                              }}
                            />
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: "#94A3B8",
                                mb: 1,
                                textAlign: "center",
                              }}
                            >
                              Candidate Entries Consulted
                            </Typography>
                            <Stack spacing={1}>
                              {result.candidateSnapshot.map((candidate) => (
                                <Typography
                                  key={candidate.id}
                                  variant="caption"
                                  sx={{ color: "#64748B" }}
                                >
                                  [{candidate.code} | Clause {candidate.clause}]{" "}
                                  {candidate.interventionType} —{" "}
                                  {candidate.problem}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                        )}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      ) : (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ maxWidth: 800, mx: "auto" }}
        >
          <Card
            sx={{
              bgcolor: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(148,163,184,0.1)",
              backdropFilter: "blur(6px)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                p: 3,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "rgba(15,23,42,0.3)",
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(148,163,184,0.3)",
                    borderRadius: "3px",
                    "&:hover": {
                      background: "rgba(148,163,184,0.5)",
                    },
                  },
                }}
              >
                <Stack spacing={3}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Road Type"
                      value={form.roadType}
                      onChange={handleFieldChange("roadType")}
                      placeholder="e.g. Divided Urban Arterial"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                    <TextField
                      label="Environment"
                      value={form.environment}
                      onChange={handleFieldChange("environment")}
                      placeholder="e.g. Hospital zone, Mixed land use"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Traffic Volume"
                      value={form.trafficVolume}
                      onChange={handleFieldChange("trafficVolume")}
                      placeholder="e.g. 22000 PCU/day"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                    <TextField
                      label="Operating Speed"
                      value={form.speedLimit}
                      onChange={handleFieldChange("speedLimit")}
                      placeholder="e.g. 60 km/h"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                  </Stack>

                  <TextField
                    label="Detailed Problem Description"
                    value={form.problemDescription}
                    onChange={handleFieldChange("problemDescription")}
                    placeholder="Describe the safety issue, observed conflicts, crash history, etc."
                    multiline
                    minRows={4}
                    variant="filled"
                    fullWidth
                    InputProps={{ sx: { color: "white" } }}
                    InputLabelProps={{ sx: { color: "#94A3B8" } }}
                  />

                  <TextField
                    label="Constraints / Implementation Notes"
                    value={form.constraints}
                    onChange={handleFieldChange("constraints")}
                    placeholder="Right-of-way limits, budget constraints, stakeholder feedback"
                    multiline
                    minRows={3}
                    variant="filled"
                    fullWidth
                    InputProps={{ sx: { color: "white" } }}
                    InputLabelProps={{ sx: { color: "#94A3B8" } }}
                  />

                  <Stack spacing={2}>
                    <Typography variant="subtitle1" sx={{ color: "#E2E8F0" }}>
                      Safety Issues
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {form.issues.map((issue) => (
                        <Chip
                          key={issue}
                          label={issue}
                          onDelete={() => handleRemoveIssue(issue)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Add Issue"
                        value={customIssue}
                        onChange={(event) => setCustomIssue(event.target.value)}
                        placeholder="Type and press add"
                        fullWidth
                        variant="filled"
                        InputProps={{ sx: { color: "white" } }}
                        InputLabelProps={{ sx: { color: "#94A3B8" } }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddIssue}
                        sx={{ minWidth: 120 }}
                      >
                        Add
                      </Button>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {presetIssues.map((issue) => (
                        <Chip
                          key={issue}
                          label={issue}
                          onClick={() => handleSelectPreset(issue)}
                          variant="outlined"
                          sx={{ cursor: "pointer" }}
                        />
                      ))}
                    </Stack>
                  </Stack>

                  <TextField
                    label="Additional Notes"
                    value={form.additionalNotes}
                    onChange={handleFieldChange("additionalNotes")}
                    placeholder="Crash locations, stakeholder priorities, design horizon"
                    multiline
                    minRows={3}
                    variant="filled"
                    fullWidth
                    InputProps={{ sx: { color: "white" } }}
                    InputLabelProps={{ sx: { color: "#94A3B8" } }}
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Filter By Category (optional)"
                      value={form.category}
                      onChange={handleFieldChange("category")}
                      placeholder="e.g. Road Sign"
                      fullWidth
                      variant="filled"
                      InputProps={{ sx: { color: "white" } }}
                      InputLabelProps={{ sx: { color: "#94A3B8" } }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ minWidth: { xs: "100%", sm: 200 }, height: 56 }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Generate"
                        )}
                      </Button>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}{" "}
      <Dialog
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setExpandedRows(new Set());
          setCurrentPage(1);
        }}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
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
            position: "relative",
            pr: 6,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <HistoryIcon /> Recent Recommendations
          </Box>
          <IconButton
            onClick={() => {
              setHistoryOpen(false);
              setExpandedRows(new Set());
              setCurrentPage(1);
            }}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
              "&:hover": {
                color: "#EF4444",
                bgcolor: "rgba(239, 68, 68, 0.1)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {historyLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Typography sx={{ color: "#94A3B8", py: 4, textAlign: "center" }}>
              No recommendations found yet. Create your first recommendation
              above!
            </Typography>
          ) : (
            <Box>
              <TableContainer
                component={Paper}
                sx={{
                  bgcolor: "rgba(15,23,42,0.5)",
                  border: "1px solid rgba(148,163,184,0.1)",
                  mb: 2,
                  overflowX: "auto",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "rgba(94,234,212,0.1)" }}>
                      <TableCell
                        sx={{
                          color: "#E2E8F0",
                          fontWeight: 700,
                          width: 50,
                          textAlign: "center",
                        }}
                      >
                        Expand
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "#E2E8F0",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        Date
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "#E2E8F0",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        Problem
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "#E2E8F0",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        Category
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "#E2E8F0",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "#E2E8F0",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                        align="center"
                      >
                        Recs
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((rec, idx) => (
                      <React.Fragment key={rec._id}>
                        <TableRow
                          sx={{
                            bgcolor:
                              idx % 2 === 0
                                ? "transparent"
                                : "rgba(15,23,42,0.3)",
                            "&:hover": { bgcolor: "rgba(16, 185, 129, 0.05)" },
                          }}
                        >
                          <TableCell sx={{ textAlign: "center" }}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleRow(rec._id)}
                              sx={{ color: "#94A3B8" }}
                            >
                              {expandedRows.has(rec._id) ? (
                                <KeyboardArrowUpIcon />
                              ) : (
                                <KeyboardArrowDownIcon />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#CBD5F5",
                              fontSize: "0.85rem",
                              textAlign: "center",
                            }}
                          >
                            {new Date(rec.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#CBD5F5",
                              maxWidth: 200,
                              textAlign: "center",
                            }}
                          >
                            <Typography variant="body2" noWrap>
                              {rec.problemDescription?.substring(0, 35)}...
                            </Typography>
                          </TableCell>
                          <TableCell
                            sx={{ color: "#CBD5F5", textAlign: "center" }}
                          >
                            {rec.category || "-"}
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            <Chip
                              label={
                                rec.status === "generated"
                                  ? "Generated"
                                  : rec.status === "reviewed"
                                  ? "Reviewed"
                                  : rec.status === "approved"
                                  ? "Approved"
                                  : "Rejected"
                              }
                              size="small"
                              sx={{
                                bgcolor:
                                  rec.status === "generated"
                                    ? "rgba(96, 125, 255, 0.1)"
                                    : rec.status === "reviewed"
                                    ? "rgba(245, 158, 11, 0.1)"
                                    : rec.status === "approved"
                                    ? "rgba(34, 197, 94, 0.1)"
                                    : "rgba(239, 68, 68, 0.1)",
                                color:
                                  rec.status === "generated"
                                    ? "#607DFF"
                                    : rec.status === "reviewed"
                                    ? "#F59E0B"
                                    : rec.status === "approved"
                                    ? "#22C55E"
                                    : "#EF4444",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: "#CBD5F5" }} align="center">
                            {rec.recommendations?.length || 0}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            sx={{
                              py: 0,
                              borderBottom: expandedRows.has(rec._id)
                                ? "1px solid rgba(94,234,212,0.2)"
                                : "none",
                            }}
                          >
                            <Collapse
                              in={expandedRows.has(rec._id)}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box sx={{ p: 2, bgcolor: "rgba(15,23,42,0.3)" }}>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: "#5EEAD4",
                                    mb: 2,
                                    textAlign: "center",
                                    fontWeight: 700,
                                  }}
                                >
                                  Complete Recommendations
                                </Typography>

                                {/* Context Information */}
                                <Box sx={{ mb: 3 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      color: "#E2E8F0",
                                      mb: 1,
                                      textAlign: "center",
                                    }}
                                  >
                                    Context:
                                  </Typography>
                                  <Stack
                                    spacing={0.5}
                                    sx={{ alignItems: "center" }}
                                  >
                                    {rec.roadType && (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "#94A3B8",
                                          textAlign: "center",
                                        }}
                                      >
                                        Road Type: {rec.roadType}
                                      </Typography>
                                    )}
                                    {rec.environment && (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "#94A3B8",
                                          textAlign: "center",
                                        }}
                                      >
                                        Environment: {rec.environment}
                                      </Typography>
                                    )}
                                    {rec.trafficVolume && (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "#94A3B8",
                                          textAlign: "center",
                                        }}
                                      >
                                        Traffic Volume: {rec.trafficVolume}
                                      </Typography>
                                    )}
                                    {rec.speedLimit && (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "#94A3B8",
                                          textAlign: "center",
                                        }}
                                      >
                                        Speed Limit: {rec.speedLimit}
                                      </Typography>
                                    )}
                                    {rec.issues && rec.issues.length > 0 && (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "#94A3B8",
                                          textAlign: "center",
                                        }}
                                      >
                                        Issues: {rec.issues.join(", ")}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>

                                {/* Recommendations */}
                                <Box sx={{ mb: 3 }}>
                                  <Stack spacing={2}>
                                    {(rec.recommendations || []).map(
                                      (item, recIdx) => (
                                        <Box
                                          key={recIdx}
                                          sx={{
                                            border:
                                              "1px solid rgba(94,234,212,0.25)",
                                            borderRadius: 2,
                                            p: 2,
                                            bgcolor: "rgba(15,23,42,0.4)",
                                          }}
                                        >
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            justifyContent="center"
                                            mb={1}
                                            flexWrap="wrap"
                                            gap={1}
                                          >
                                            <Chip
                                              label={item.confidence || "-"}
                                              size="small"
                                              color={
                                                item.confidence === "High"
                                                  ? "error"
                                                  : item.confidence === "Medium"
                                                  ? "warning"
                                                  : item.confidence === "Low"
                                                  ? "success"
                                                  : "default"
                                              }
                                            />
                                            <Chip
                                              label={`${
                                                item.ircReference?.code || ""
                                              } | Clause ${
                                                item.ircReference?.clause || ""
                                              }`}
                                              size="small"
                                              variant="outlined"
                                              sx={{
                                                color: "#5EEAD4",
                                                borderColor:
                                                  "rgba(94,234,212,0.25)",
                                              }}
                                            />
                                          </Stack>
                                          <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            gutterBottom
                                            sx={{
                                              textAlign: "center",
                                              color: "#E2E8F0",
                                            }}
                                          >
                                            {item.title}
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ color: "#CBD5F5" }}
                                            gutterBottom
                                          >
                                            {item.recommendedAction}
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ color: "#94A3B8" }}
                                            gutterBottom
                                          >
                                            {item.justification}
                                          </Typography>
                                          {item.matchingFactors &&
                                            item.matchingFactors.length > 0 && (
                                              <Typography
                                                variant="caption"
                                                sx={{ color: "#64748B" }}
                                              >
                                                Matching Factors:{" "}
                                                {item.matchingFactors.join(
                                                  ", "
                                                )}
                                              </Typography>
                                            )}
                                          {item.followUp &&
                                            item.followUp.length > 0 && (
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  display: "block",
                                                  color: "#64748B",
                                                  mt: 0.5,
                                                }}
                                              >
                                                Follow-up:{" "}
                                                {item.followUp.join(", ")}
                                              </Typography>
                                            )}
                                        </Box>
                                      )
                                    )}
                                  </Stack>
                                </Box>

                                {/* Supporting Notes */}
                                {rec.supportingNotes && (
                                  <Box sx={{ mb: 3 }}>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        color: "#E2E8F0",
                                        textAlign: "center",
                                      }}
                                    >
                                      Supporting Notes
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "#94A3B8" }}
                                    >
                                      {rec.supportingNotes}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Follow-up Questions */}
                                {rec.followUpQuestions &&
                                  rec.followUpQuestions.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography
                                        variant="subtitle1"
                                        sx={{
                                          color: "#E2E8F0",
                                          textAlign: "center",
                                        }}
                                      >
                                        Follow-up Questions
                                      </Typography>
                                      <Stack
                                        spacing={1}
                                        sx={{ alignItems: "center" }}
                                      >
                                        {rec.followUpQuestions.map(
                                          (question, idx) => (
                                            <Typography
                                              key={idx}
                                              variant="body2"
                                              sx={{
                                                color: "#94A3B8",
                                                textAlign: "center",
                                              }}
                                            >
                                              • {question}
                                            </Typography>
                                          )
                                        )}
                                      </Stack>
                                    </Box>
                                  )}

                                {/* Candidate Snapshot */}
                                {rec.candidateSnapshot &&
                                  rec.candidateSnapshot.length > 0 && (
                                    <Box>
                                      <Divider
                                        sx={{
                                          borderColor: "rgba(148,163,184,0.2)",
                                          mb: 2,
                                        }}
                                      />
                                      <Typography
                                        variant="subtitle2"
                                        sx={{
                                          color: "#94A3B8",
                                          mb: 1,
                                          textAlign: "center",
                                        }}
                                      >
                                        Candidate Entries Consulted
                                      </Typography>
                                      <Stack
                                        spacing={1}
                                        sx={{ alignItems: "center" }}
                                      >
                                        {rec.candidateSnapshot.map(
                                          (candidate) => (
                                            <Typography
                                              key={candidate.id}
                                              variant="caption"
                                              sx={{
                                                color: "#64748B",
                                                textAlign: "center",
                                              }}
                                            >
                                              [{candidate.code} | Clause{" "}
                                              {candidate.clause}]{" "}
                                              {candidate.interventionType} —{" "}
                                              {candidate.problem}
                                            </Typography>
                                          )
                                        )}
                                      </Stack>
                                    </Box>
                                  )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    sx={{
                      "& .MuiPaginationItem-root": {
                        color: "#94A3B8",
                      },
                      "& .Mui-selected": {
                        bgcolor: "rgba(94,234,212,0.2)",
                        color: "#5EEAD4",
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
