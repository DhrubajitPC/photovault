import express from "express";
import { port } from "./config/env";
import photoRouter from "./routes/photos";
import { pool } from "./db/db";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "PhotoVault backend is running" });
});

app.use("/photos", photoRouter);

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to the database successfully");

    app.listen(port, () => {
      console.log(`PhotoVault backend listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  }
}

start();
