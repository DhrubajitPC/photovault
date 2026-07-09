type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function serializeError(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error;
  }

  const errorWithDetails = error as Error & {
    code?: unknown;
    Code?: unknown;
    $metadata?: unknown;
    cause?: unknown;
  };

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: errorWithDetails.code ?? errorWithDetails.Code,
    metadata: errorWithDetails.$metadata,
    cause: errorWithDetails.cause,
  };
}

function writeLog(
  level: LogLevel,
  event: string,
  message: string,
  fields: LogFields = {},
): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    ...fields,
  };

  const logLine = JSON.stringify(payload, (_key, value) => {
    if (value instanceof Error) {
      return serializeError(value);
    }

    return value;
  });

  if (level === "error") {
    console.error(logLine);
    return;
  }

  if (level === "warn") {
    console.warn(logLine);
    return;
  }

  console.info(logLine);
}

export const logger = {
  info(event: string, message: string, fields?: LogFields): void {
    writeLog("info", event, message, fields);
  },
  warn(event: string, message: string, fields?: LogFields): void {
    writeLog("warn", event, message, fields);
  },
  error(event: string, message: string, fields?: LogFields): void {
    writeLog("error", event, message, fields);
  },
  serializeError,
};
