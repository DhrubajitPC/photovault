import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

const environment = process.env.NODE_ENV ?? "local";

dotenv.config({
  path: path.resolve(__dirname, "../..", `.env.${environment}`),
  quiet: true,
});

const portSchema = z.coerce.number().int().min(1).max(65535);

const serverSchema = z
  .object({
    PORT: portSchema.default(3000),
  })
  .transform((env) => ({ port: env.PORT }));

const databaseSchema = z
  .object({
    DB_HOST: z.string().trim().min(1),
    DB_PORT: portSchema.default(5432),
    DB_NAME: z.string().trim().min(1),
    DB_USER: z.string().trim().min(1),
    DB_PASSWORD: z.string().default(""),
  })
  .transform((env) => ({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  }));

const awsSchema = z
  .object({
    AWS_REGION: z.string().trim().min(1),
    S3_BUCKET_NAME: z.string().trim().min(1),
  })
  .transform((env) => ({
    region: env.AWS_REGION,
    bucketName: env.S3_BUCKET_NAME,
  }));

interface AppConfig {
  server: z.infer<typeof serverSchema>;
  db: z.infer<typeof databaseSchema>;
  aws: z.infer<typeof awsSchema>;
}

const cache: Partial<AppConfig> = {};

const config: AppConfig = {
  get server() {
    return (cache.server ??= serverSchema.parse(process.env));
  },
  get db() {
    return (cache.db ??= databaseSchema.parse(process.env));
  },
  get aws() {
    return (cache.aws ??= awsSchema.parse(process.env));
  },
};

export default config;
