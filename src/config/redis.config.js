import redis from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || "secretpassword",
  retry_strategy: (options) => {
    if (options.error && options.error.code === "ECONNREFUSED") {
      console.error("❌ Redis server connection refused.");
      return new Error("Redis server connection refused");
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error("❌ Redis retry time exhausted.");
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      console.error("❌ Redis connection attempts exceeded.");
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

// Redis connection events
redisClient.on("connect", () => {
  console.log("✅ Redis client connected");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

redisClient.on("ready", () => {
  console.log("✅ Redis client ready");
});

redisClient.on("end", () => {
  console.log("🔄 Redis client disconnected");
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connection established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to Redis:", error);
    process.exit(1);
  }
};

// Redis utility functions
export const redisUtils = {
  // Set refresh token
  setRefreshToken: async (userId, token, expiresIn = 604800) => {
    const key = `${process.env.JWT_REDIS_PREFIX || "session"}:${userId}`;
    await redisClient.setEx(key, expiresIn, token);
  },

  // Get refresh token
  getRefreshToken: async (userId) => {
    const key = `${process.env.JWT_REDIS_PREFIX || "session"}:${userId}`;
    return await redisClient.get(key);
  },

  // Delete refresh token
  deleteRefreshToken: async (userId) => {
    const key = `${process.env.JWT_REDIS_PREFIX || "session"}:${userId}`;
    await redisClient.del(key);
  },

  // Check if refresh token exists
  hasRefreshToken: async (userId) => {
    const key = `${process.env.JWT_REDIS_PREFIX || "session"}:${userId}`;
    return (await redisClient.exists(key)) === 1;
  },
};

export default redisClient;
