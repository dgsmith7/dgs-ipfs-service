import winston from "winston";
import "winston-mongodb"; // Ensure this package is installed via npm
import dotenv from "dotenv";

dotenv.config();

const { combine, timestamp, printf, errors } = winston.format;

const logFormat = combine(
  timestamp(),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  })
);

const mongoTransport = new winston.transports.MongoDB({
  db: process.env.MONGO_URI, // Or use a dedicated logging DB URI if preferred
  options: { useUnifiedTopology: true },
  collection: "app_logs",
  tryReconnect: true,
  level: "info",
});

const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [mongoTransport],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
