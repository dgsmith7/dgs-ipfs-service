import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import freeRoutes from "./routes/freeRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import configurePassport from "./config/passport.js";
import cors from "cors";
import logger from "./config/logger.js";
import cron from "node-cron";
import { updateUserVolumes } from "./cron/updateUserVolumes.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

//  dont do this:   Trust the reverse proxy
//app.set("trust proxy", 1);
Trust the reverse proxy if deployed
app.set("trust proxy", 1);

// Use Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // disable CSP set by Helmet
  })
);

// Configure CORS – adjust origin as needed
app.use(
  cors({
       origin: "http://pin.dgs-creative.com", // update to your frontend domain if needed
       credentials: true,
  })
);

// Rate limiting: limit each IP to 100 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Basic middleware configuration
app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

// Request logging middleware
app.use((req, res, next) => {
  logger.info(
    `Incoming ${req.method} request to ${req.originalUrl} from ${req.ip}`
  );
  next();
});

// Optionally enable CORS if needed
// app.use(cors());

if (process.env.NODE_ENV === "production") {
  // Enable production-specific middleware settings, if needed.
  app.use((req, res, next) => {
    // For instance, enforce secure cookies or stricter headers.
    next();
  });
}

// Connect to MongoDB and log errors if any
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("MongoDB connected");
    console.log("MongoDB connected");
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    console.error("MongoDB connection error:", err);
  });

// Configure passport and initialize
configurePassport();
app.use(passport.initialize());

// Mount routes; note protectedRoutes & profileRoutes are behind JWT authentication
app.use("/", freeRoutes);
app.use(
  "/protected",
  passport.authenticate("jwt", { session: false, failureRedirect: "/login" }),
  protectedRoutes
);
app.use("/api", apiRoutes);

// Schedule daily update at 8:00 am server time
cron.schedule("0 8 * * *", () => {
  console.log("Running daily user volume update");
  updateUserVolumes();
});

// Listen on designated port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

// Centralized error handling middleware (production best practice)
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ msg: "Internal server error", error: err.message });
});
