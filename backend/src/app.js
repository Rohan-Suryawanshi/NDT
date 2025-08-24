import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

app.use(cors({
  origin:process.env.CORS_ORIGIN,
  credentials:true,
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan('dev'));

//Routes
import userRoutes from './routes/user.routes.js';
import serviceProviderRoutes from "./routes/serviceProvider.routes.js";
import clientRoutes from "./routes/clientProfile.routes.js";
import serviceRoutes from './routes/service.routes.js';
import inspectorRoutes from './routes/inspector.routes.js';
import certificateRoutes from './routes/companyCertification.routes.js'
import equipmentRoutes from "./routes/equipment.routes.js";
import skillMatrixRoutes from "./routes/skillMatrix.routes.js";
import offeredServices from "./routes/serviceOffered.routes.js";
import geminiRoutes from "./routes/gemini.routes.js";
import jobRequestRoutes from "./routes/jobRequest.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminSettingsRoutes from "./routes/adminSettings.routes.js";
import "./cronJobs/certificateExpiryAlert.js";
import "./cronJobs/skillMatrixExpiryAlert.js";

//http://localhost:8000/api/v1/users/register
app.use('/api/v1/users', userRoutes);
app.use("/api/v1/service-provider", serviceProviderRoutes);
app.use("/api/v1/client-routes", clientRoutes);
app.use("/api/v1/service", serviceRoutes);
app.use("/api/v1/inspectors", inspectorRoutes);
app.use("/api/v1/certificates", certificateRoutes);
app.use("/api/v1/equipments", equipmentRoutes);
app.use("/api/v1/skill-matrix", skillMatrixRoutes);
app.use("/api/v1/offered-services", offeredServices);
app.use("/api/v1/gemini", geminiRoutes);
app.use("/api/v1/job-requests", jobRequestRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/admin/settings", adminSettingsRoutes);



//Error Handling middleware
app.use((err, req, res, next) => {
  console.error(" 🥺 Error:", err.message); // Logs the error for debug

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export {app};