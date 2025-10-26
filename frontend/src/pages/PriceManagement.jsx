import React, { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
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
import axios from "axios";
import SearchIcon from "@mui/icons-material/Search";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

export default function PriceManagement() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState({ total: 0, categories: 0, avgPrice: 0 });

  const search = () => {
    setLoading(true);
    axios
      .get(
        (import.meta.env.VITE_API_URL || "http://localhost:5000") +
          "/api/prices/search",
        {
          params: { query },
        }
      )
      .then((r) => {
        const data = r.data.data || [];
        setResults(data);

        const categories = new Set(data.map((item) => item.category)).size;
        const avgPrice =
          data.length > 0
            ? data.reduce((sum, item) => sum + (item.unitPrice || 0), 0) /
              data.length
            : 0;

        setStats({
          total: data.length,
          categories,
          avgPrice: Math.round(avgPrice),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    search();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    search();
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Price Management
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Search and manage material prices from CPWD SOR, GeM Portal, and other
          sources
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: "rgba(16, 185, 129, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "primary.main",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <LocalOfferOutlinedIcon />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Total Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: "rgba(230, 126, 34, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "secondary.main",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <CategoryOutlinedIcon />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.categories}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: "rgba(39, 174, 96, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "success.main",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <TrendingUpIcon />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ₹{stats.avgPrice.toLocaleString("en-IN")}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Avg Price
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
          <form onSubmit={handleSearch}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                placeholder="Search for materials, items, or categories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: query && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setQuery("")}>
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
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ px: 4, fontWeight: 600, minWidth: 120 }}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </Box>
          </form>
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
                ? "Try adjusting your search terms"
                : "Enter keywords to search for material prices"}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Item Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Category
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Specification
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                    >
                      Unit Price
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Unit
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Source
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <TableRow
                        key={item._id}
                        hover
                        sx={{
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            bgcolor: "rgba(16, 185, 129, 0.04)",
                          },
                        }}
                      >
                        <TableCell sx={{ py: 2.5 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
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
                              <LocalOfferOutlinedIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                              >
                                {item.itemName}
                              </Typography>
                              {item.itemCode && (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Code: {item.itemCode}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.category || "General"}
                            size="small"
                            sx={{
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              maxWidth: 250,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.specification || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, color: "primary.main" }}
                          >
                            ₹{(item.unitPrice || 0).toLocaleString("en-IN")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.unit || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.source || "Unknown"}
                            size="small"
                            color="default"
                            variant="outlined"
                            sx={{
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
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
          </>
        )}
      </Paper>

      <Box
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 3,
          bgcolor: "rgba(16, 185, 129, 0.05)",
          border: "1px solid",
          borderColor: "rgba(16, 185, 129, 0.2)",
          textAlign: "center",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          📊 Data Sources
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              CPWD SOR
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Central Public Works Department Schedule of Rates
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              GeM Portal
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Government e-Marketplace pricing data
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              Official Sources
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Other verified government sources
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
