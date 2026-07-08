import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const port = parsePort(process.env.PORT, 3000);

export const db = {
  host: process.env.DB_HOST,
  port: parsePort(process.env.DB_PORT, 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

export const aws = {
  region: process.env.AWS_REGION,
  bucketName: process.env.S3_BUCKET_NAME,
};

const config = {
  port,
  db,
  aws,
};

export default config;
