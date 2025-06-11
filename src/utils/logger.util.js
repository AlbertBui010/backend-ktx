import fs from "fs";
import path from "path";

const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

const LOG_COLORS = {
  ERROR: "\x1b[31m", // Red
  WARN: "\x1b[33m", // Yellow
  INFO: "\x1b[36m", // Cyan
  DEBUG: "\x1b[35m", // Magenta
  RESET: "\x1b[0m", // Reset
};

class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), "logs");
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  writeToFile(level, formattedMessage) {
    if (process.env.NODE_ENV === "production") {
      const logFile = path.join(this.logDir, `${new Date().toISOString().split("T")[0]}.log`);
      fs.appendFileSync(logFile, formattedMessage + "\n");
    }
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);

    // Console output with colors
    const color = LOG_COLORS[level] || LOG_COLORS.RESET;
    console.log(`${color}${formattedMessage}${LOG_COLORS.RESET}`);

    // File output (production only)
    this.writeToFile(level, formattedMessage);
  }

  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === "development") {
      this.log(LOG_LEVELS.DEBUG, message, meta);
    }
  }

  // Authentication specific logs
  auth = {
    loginSuccess: (userType, userId, userIdentifier) => {
      this.info("User login successful", {
        userType,
        userId,
        userIdentifier,
        action: "LOGIN_SUCCESS",
      });
    },

    loginFailed: (userType, userIdentifier, reason) => {
      this.warn("User login failed", {
        userType,
        userIdentifier,
        reason,
        action: "LOGIN_FAILED",
      });
    },

    logout: (userType, userId) => {
      this.info("User logout", {
        userType,
        userId,
        action: "LOGOUT",
      });
    },

    tokenRefresh: (userType, userId) => {
      this.debug("Token refresh", {
        userType,
        userId,
        action: "TOKEN_REFRESH",
      });
    },

    passwordChange: (userType, userId) => {
      this.info("Password changed", {
        userType,
        userId,
        action: "PASSWORD_CHANGE",
      });
    },

    accountCreated: (userType, createdUserId, creatorId) => {
      this.info("Account created", {
        userType,
        createdUserId,
        creatorId,
        action: "ACCOUNT_CREATED",
      });
    },
  };

  // Database specific logs
  db = {
    connected: () => {
      this.info("Database connected successfully");
    },

    error: (error, query = null) => {
      this.error("Database error", { error: error.message, query });
    },

    slowQuery: (query, duration) => {
      this.warn("Slow database query detected", { query, duration });
    },
  };

  // Redis specific logs
  redis = {
    connected: () => {
      this.info("Redis connected successfully");
    },

    error: (error) => {
      this.error("Redis error", { error: error.message });
    },

    sessionSet: (userId) => {
      this.debug("Session stored in Redis", { userId });
    },

    sessionDeleted: (userId) => {
      this.debug("Session deleted from Redis", { userId });
    },
  };
}

// Export singleton instance
export default new Logger();
