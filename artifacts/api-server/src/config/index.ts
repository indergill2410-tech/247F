interface AppConfig {
  port: number;
  nodeEnv: string;
  appUrl: string;
  sessionSecret: string;
  databaseUrl: string;
  adminEmails: string[];
  resend: {
    enabled: boolean;
    apiKey: string;
    fromEmail: string;
  };
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function buildConfig(): AppConfig {
  const sessionSecret = requireEnv("SESSION_SECRET");
  const databaseUrl = requireEnv("DATABASE_URL");
  const rawPort = requireEnv("PORT");
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

  const nodeEnv = optionalEnv("NODE_ENV", "development");
  const appUrl = optionalEnv("APP_URL", "http://localhost:" + rawPort);
  const adminEmails = optionalEnv("ADMIN_EMAILS", "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const resendApiKey = optionalEnv("RESEND_API_KEY");
  const fromEmail = optionalEnv("FROM_EMAIL", "noreply@fixit247.com.au");

  return {
    port,
    nodeEnv,
    appUrl,
    sessionSecret,
    databaseUrl,
    adminEmails,
    resend: {
      enabled: Boolean(resendApiKey),
      apiKey: resendApiKey,
      fromEmail,
    },
  };
}

export const config = buildConfig();
