import React, { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

export default function Estimates() {
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);

    const mockEstimates = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mock-estimate-")) {
        try {
          const estimate = JSON.parse(localStorage.getItem(key));
          mockEstimates.push(estimate);
        } catch (e) {
          console.error("Failed to parse mock estimate:", e);
        }
      }
    }

    axios
      .get(
        (import.meta.env.VITE_API_URL || "http://localhost:5000") +
          "/api/estimator"
      )
      .then((r) => {
        const apiEstimates = r.data.data.estimates || [];

        const allEstimates = [...mockEstimates, ...apiEstimates].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setList(allEstimates);
        setFilteredList(allEstimates);
      })
      .catch(() => {
        setList(mockEstimates);
        setFilteredList(mockEstimates);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = list.filter(
        (item) =>
          item.documentName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.status?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredList(filtered);
      setPage(0);
    } else {
      setFilteredList(list);
    }
  }, [searchQuery, list]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box className="fade-in">
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            All Estimates
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            View and manage all your intervention cost estimates
          </Typography>
        </Box>
        <Chip
          label={`${filteredList.length} Estimate${
            filteredList.length !== 1 ? "s" : ""
          }`}
          color="primary"
          sx={{
            fontWeight: 600,
            fontSize: "0.875rem",
            px: 1,
            position: "absolute",
            right: 0,
          }}
        />
      </Box>

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
          <TextField
            fullWidth
            placeholder="Search by document name or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    ✕
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(30, 41, 59, 0.5)",
              },
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ p: 4 }}>
            <LinearProgress />
            <Typography
              variant="body2"
              sx={{ textAlign: "center", mt: 2, color: "text.secondary" }}
            >
              Loading estimates...
            </Typography>
          </Box>
        ) : filteredList.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              px: 3,
            }}
          >
            <DescriptionOutlinedIcon
              sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
              {searchQuery ? "No estimates found" : "No estimates yet"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Upload your first intervention report to get started"}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                    >
                      Document Name
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                    >
                      Created Date
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                    >
                      Material Cost
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredList
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow
                        key={row._id}
                        hover
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            bgcolor: "rgba(16, 185, 129, 0.04)",
                          },
                        }}
                      >
                        <TableCell
                          align="center"
                          onClick={() => navigate(`/estimates/${row._id}`)}
                          sx={{ py: 2.5 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: "primary.light",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                              }}
                            >
                              <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600, textAlign: "center" }}
                            >
                              {row.documentName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell
                          align="center"
                          onClick={() => navigate(`/estimates/${row._id}`)}
                        >
                          <Chip
                            label={row.status}
                            color={getStatusColor(row.status)}
                            size="small"
                            sx={{
                              textTransform: "capitalize",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        </TableCell>
                        <TableCell
                          align="center"
                          onClick={() => navigate(`/estimates/${row._id}`)}
                        >
                          <Typography variant="body2">
                            {new Date(row.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {new Date(row.createdAt).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          onClick={() => navigate(`/estimates/${row._id}`)}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, color: "primary.main" }}
                          >
                            ₹
                            {(row.totalMaterialCost || 0).toLocaleString(
                              "en-IN"
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/estimates/${row._id}`)}
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              "&:hover": {
                                bgcolor: "primary.dark",
                                transform: "scale(1.1)",
                              },
                            }}
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredList.length}
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
    </Box>
  );
}
