import express from "express";
import config from "./config";
import photoRouter from "./routes/photos";
import { pool } from "./db/db";
import { requestLogger } from "./middleware/requestLogger";

const app = express();

app.use(requestLogger);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "PhotoVault backend is running" });
});

app.use("/photos", photoRouter);

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to the database successfully");

    app.listen(config.server.port, () => {
      console.log(`PhotoVault backend listening on port ${config.server.port}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  }
}

start();
