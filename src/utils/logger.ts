/**
 * Logger utility for consistent logging throughout the application
 * Provides different log levels and prefixing capability
 */
import * as fs from "fs";
import * as path from "path";

// Log levels with color codes for console output
enum LogLevel {
  DEBUG = "\x1b[36m%s\x1b[0m", // Cyan
  INFO = "\x1b[32m%s\x1b[0m", // Green
  WARN = "\x1b[33m%s\x1b[0m", // Yellow
  ERROR = "\x1b[31m%s\x1b[0m", // Red
  TOOL = "\x1b[35m%s\x1b[0m", // Magenta - specific for tool operations
  PLAYWRIGHT = "\x1b[34m%s\x1b[0m", // Blue - specific for Playwright operations
}

/**
 * Logger class for centralized logging
 */
class Logger {
  private static instance: Logger;
  private logToFile: boolean = false;
  private logFilePath: string = path.join(
    process.cwd(),
    "outputDir",
    "application.log"
  );

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Enable logging to a file
   * @param filePath Path to the log file (optional, defaults to outputDir/application.log in project root)
   */
  public enableFileLogging(filePath?: string): void {
    this.logToFile = true;

    // If no filepath is provided, use the default path in project root
    if (!filePath) {
      filePath = this.logFilePath;
    }

    this.logFilePath = filePath;

    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create or clear the log file
    fs.writeFileSync(filePath, "");

    this.info("File logging enabled to: " + filePath);
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param context Optional context object to log
   */
  public debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, "DEBUG", message, context);
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param context Optional context object to log
   */
  public info(message: string, context?: any): void {
    this.log(LogLevel.INFO, "INFO", message, context);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param context Optional context object to log
   */
  public warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, "WARN", message, context);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param error Optional error object to log
   */
  public error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, "ERROR", message, error);
    if (error && error instanceof Error) {
      console.error(error.stack);
    }
  }

  /**
   * Log a tool operation
   * @param toolName Name of the tool
   * @param operation The operation being performed
   * @param details Details about the operation
   */
  public tool(toolName: string, operation: string, details?: any): void {
    const message = `${toolName} - ${operation}`;
    this.log(LogLevel.TOOL, "TOOL", message, details);
  }

  /**
   * Log a Playwright action or operation
   * @param action The Playwright action being performed (click, type, navigate, etc.)
   * @param selector The selector being targeted (if applicable)
   * @param details Additional details about the action (text being typed, URL, timeout, etc.)
   * @param status Status of the action (start, success, failure)
   */
  public playwright(
    action: string,
    selector?: string,
    details?: Record<string, any>,
    status: "start" | "success" | "failure" = "start"
  ): void {
    let message = `PLAYWRIGHT [${status.toUpperCase()}] - ${action}`;

    if (selector) {
      message += ` on "${selector}"`;
    }

    this.log(LogLevel.PLAYWRIGHT, "PLAYWRIGHT", message, details);
  }

  /**
   * Log a Playwright error with extended information
   * @param action The action that failed
   * @param error The error that occurred
   * @param context Additional context (selector, page information, etc.)
   */
  public playwrightError(
    action: string,
    error: any,
    context?: Record<string, any>
  ): void {
    const message = `PLAYWRIGHT ERROR - ${action} failed`;

    // Combine error and context into a single object for better logging
    const errorDetails = {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      context,
    };

    this.log(LogLevel.ERROR, "PLAYWRIGHT_ERROR", message, errorDetails);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    context?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${levelName}] ${message}`;

    // Console logging with colors
    console.log(level, logMessage);

    // Log additional context if provided
    if (context) {
      console.log(context);
    }

    // File logging implementation
    if (this.logToFile) {
      try {
        let contextStr = "";
        if (context) {
          if (context instanceof Error) {
            contextStr = `\nError: ${context.message}\n${context.stack || ""}`;
          } else {
            contextStr = `\nContext: ${JSON.stringify(context, null, 2)}`;
          }
        }

        const fileLogMessage = `${logMessage}${contextStr}\n`;
        fs.appendFileSync(this.logFilePath, fileLogMessage);
      } catch (error) {
        console.error("Failed to write to log file:", error);
      }
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
