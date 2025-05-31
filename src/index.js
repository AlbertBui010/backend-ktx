import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import healthRoutes from "./routes/health.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api", healthRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
