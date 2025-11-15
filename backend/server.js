import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import connectDB from "./config/database.js";
import estimatorRoutes from "./routes/estimator.routes.js";
import priceRoutes from "./routes/price.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import interventionRoutes from "./routes/intervention.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://safety-estimator-tool.netlify.app"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    abortOnLimit: true,
    responseOnLimit: "File size exceeds 10MB limit",
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Estimator Tool For Intervention API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/estimator", estimatorRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/interventions", interventionRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
