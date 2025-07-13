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

//http://localhost:8000/api/v1/users/register
app.use('/api/v1/users', userRoutes);
app.use("/api/v1/service-provider", serviceProviderRoutes);
app.use("/api/v1/client-routes", clientRoutes);
app.use("/api/v1/service", serviceRoutes);
app.use("/api/v1/inspector", inspectorRoutes);

//Error Handling middleware
app.use((err, req, res, next) => {
  console.error(" 🥺 Error:", err.message); // Logs the error for debug

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export {app};