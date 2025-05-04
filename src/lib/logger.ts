import pino from "pino";

// Determine if running in development or production
// Astro provides import.meta.env.DEV and import.meta.env.PROD
const isDevelopment = import.meta.env.DEV;

// Configure Pino logger
// In development, use pino-pretty for human-readable output
// In production, use standard JSON format for better machine processing
const logger = pino({
  level: isDevelopment ? "debug" : "info", // Log debug messages only in development
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true, // Colorize output
          levelFirst: true, // Show level first
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l", // Human-readable time format
          ignore: "pid,hostname", // Ignore pid and hostname fields
        },
      }
    : undefined, // Use default JSON transport in production
});

export default logger;
