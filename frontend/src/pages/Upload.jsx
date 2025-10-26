import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [estimateId, setEstimateId] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setUploadProgress(0);
      setEstimateId(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
  });

  const pollProcessingStatus = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/api/estimator/${id}`);
      const estimate = response.data.data;

      if (estimate.status === "completed") {
        setProcessing(false);
        enqueueSnackbar("Analysis completed successfully!", {
          variant: "success",
        });
        setTimeout(() => navigate(`/estimates/${id}`), 500);
        return true;
      } else if (estimate.status === "failed") {
        setProcessing(false);
        enqueueSnackbar(
          estimate.errorMessage || "Processing failed. Please try again.",
          { variant: "error" }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error polling status:", error);
      return false;
    }
  };

  const startPolling = (id) => {
    const interval = setInterval(async () => {
      const completed = await pollProcessingStatus(id);
      if (completed) {
        clearInterval(interval);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      if (processing) {
        setProcessing(false);
        enqueueSnackbar(
          "Processing is taking longer than expected. Please check back later.",
          { variant: "warning" }
        );
      }
    }, 300000);
  };

  const upload = async () => {
    if (!file) {
      enqueueSnackbar("Please select a file", { variant: "warning" });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("document", file);

      const uploadResponse = await axios.post(
        `${API_URL}/api/estimator/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) =>
            setUploadProgress(Math.round((e.loaded / e.total) * 100)),
        }
      );

      const uploadedEstimateId = uploadResponse.data.data.estimateId;
      setEstimateId(uploadedEstimateId);
      setUploading(false);

      enqueueSnackbar("File uploaded successfully! Starting AI analysis...", {
        variant: "success",
      });

      setProcessing(true);

      await axios.post(
        `${API_URL}/api/estimator/process/${uploadedEstimateId}`
      );

      startPolling(uploadedEstimateId);
    } catch (error) {
      console.error("Upload error:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Upload failed. Please try again.",
        { variant: "error" }
      );
      setUploading(false);
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    setEstimateId(null);
  };

  const supportedFormats = [
    { format: "PDF", description: "Portable Document Format", icon: "📄" },
    { format: "DOCX", description: "Microsoft Word Document", icon: "📝" },
    { format: "TXT", description: "Plain Text File", icon: "📃" },
  ];

  const isProcessingOrUploading = uploading || processing;

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4, textAlign: "center", position: "relative" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Upload Intervention Report
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Upload your road safety intervention report to get AI-powered cost
          estimates based on IRC standards
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          {...getRootProps()}
          sx={{
            border: "2px dashed",
            borderColor: isDragActive ? "primary.main" : "divider",
            borderRadius: 3,
            p: 6,
            textAlign: "center",
            cursor: isProcessingOrUploading ? "not-allowed" : "pointer",
            bgcolor: isDragActive
              ? "rgba(16, 185, 129, 0.05)"
              : "rgba(30, 41, 59, 0.5)",
            transition: "all 0.3s ease-in-out",
            position: "relative",
            overflow: "hidden",
            opacity: isProcessingOrUploading ? 0.6 : 1,
            "&:hover": {
              borderColor: isProcessingOrUploading ? "divider" : "primary.main",
              bgcolor: isProcessingOrUploading
                ? "rgba(30, 41, 59, 0.5)"
                : "rgba(16, 185, 129, 0.05)",
              transform: isProcessingOrUploading ? "none" : "scale(1.01)",
            },
          }}
        >
          <input {...getInputProps()} disabled={isProcessingOrUploading} />

          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: isDragActive
                ? "primary.main"
                : "rgba(16, 185, 129, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              mb: 3,
              transition: "all 0.3s ease-in-out",
            }}
          >
            <CloudUploadOutlinedIcon
              sx={{
                fontSize: 40,
                color: isDragActive ? "white" : "primary.main",
              }}
            />
          </Box>

          {file ? (
            <Box>
              <CheckCircleOutlineIcon
                sx={{ fontSize: 48, color: "success.main", mb: 2 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                File Selected
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {isDragActive ? "Drop the file here" : "No file chosen"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 2 }}
              >
                Drag & drop your file here or click to browse
              </Typography>
              <Chip
                label="Max file size: 10MB"
                size="small"
                sx={{
                  bgcolor: "rgba(16, 185, 129, 0.15)",
                  color: "primary.main",
                  fontWeight: 500,
                  border: "1px solid",
                  borderColor: "primary.main",
                }}
              />
            </Box>
          )}
        </Box>

        {file && (
          <Box
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 2,
              bgcolor: "success.light",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {file.name}
                </Typography>
                <Typography variant="caption">
                  {(file.size / 1024).toFixed(2)} KB •{" "}
                  {file.type || "Unknown type"}
                </Typography>
              </Box>
            </Box>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              startIcon={<DeleteOutlineIcon />}
              disabled={isProcessingOrUploading}
              sx={{
                color: "white",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
              }}
            >
              Remove
            </Button>
          </Box>
        )}

        {uploading && uploadProgress > 0 && (
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Uploading document...
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "primary.main" }}
              >
                {uploadProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(51, 65, 85, 0.5)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        )}

        {processing && (
          <Box
            sx={{
              mt: 3,
              p: 3,
              borderRadius: 2,
              bgcolor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid",
              borderColor: "primary.main",
              textAlign: "center",
            }}
          >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              AI Analysis in Progress
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Extracting interventions, mapping IRC standards, and calculating
              costs...
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", mt: 1, display: "block" }}
            >
              This may take a few minutes depending on the document size
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            onClick={upload}
            disabled={!file || isProcessingOrUploading}
            startIcon={
              isProcessingOrUploading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CloudUploadOutlinedIcon />
              )
            }
            sx={{
              px: 4,
              fontWeight: 600,
              bgcolor: "#10B981",
              "&:hover": {
                bgcolor: "#059669",
              },
            }}
          >
            {uploading
              ? "Uploading..."
              : processing
              ? "Processing..."
              : "Upload & Process"}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={removeFile}
            disabled={!file || isProcessingOrUploading}
            sx={{
              fontWeight: 600,
              borderColor: "#F59E0B",
              color: "#F59E0B",
              "&:hover": {
                borderColor: "#D97706",
                bgcolor: "rgba(245, 158, 11, 0.08)",
              },
            }}
          >
            Clear
          </Button>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Supported File Formats
          </Typography>
          <List sx={{ maxWidth: 600, mx: "auto" }}>
            {supportedFormats.map((format, index) => (
              <ListItem
                key={index}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: "rgba(30, 41, 59, 0.5)",
                  "&:hover": { bgcolor: "rgba(16, 185, 129, 0.08)" },
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <ListItemIcon sx={{ minWidth: 48, justifyContent: "center" }}>
                  <Box sx={{ fontSize: 28 }}>{format.icon}</Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {format.format}
                    </Typography>
                  }
                  secondary={format.description}
                  sx={{ textAlign: "left" }}
                />
                <CheckCircleOutlineIcon sx={{ color: "success.main" }} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 2,
            bgcolor: "rgba(16, 185, 129, 0.05)",
            border: "1px solid",
            borderColor: "rgba(16, 185, 129, 0.2)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <DescriptionOutlinedIcon /> What happens after upload?
          </Typography>
          <List sx={{ maxWidth: 700, mx: "auto", textAlign: "left" }}>
            {[
              "AI analyzes your intervention report and extracts all sections",
              "Identifies technical specifications from IRC standards (IRC 35, 67, 99, SP:73, SP:84, SP:87, 79, 82, 93)",
              "Determines required material quantities for each intervention",
              "Fetches current unit prices from CPWD SOR and GeM portal database",
              "Generates detailed cost estimate with IRC clause citations and rationale",
            ].map((step, index) => (
              <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {index + 1}. {step}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>
    </Box>
  );
}
