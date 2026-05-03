interface AppConfig {
  port: number;
  nodeEnv: string;
  appUrl: string;
  sessionSecret: string;
  databaseUrl: string;
  adminEmails: string[];
  sendgrid: {
    enabled: boolean;
    apiKey: string;
    fromEmail: string;
    templates: {
      customerWelcome: string;
      tradieWelcome: string;
      otp: string;
    };
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
  // Always required
  const sessionSecret = requireEnv("SESSION_SECRET");
  const databaseUrl = requireEnv("DATABASE_URL");
  const rawPort = requireEnv("PORT");
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

  // Optional with safe defaults
  const nodeEnv = optionalEnv("NODE_ENV", "development");
  const appUrl = optionalEnv("APP_URL", "http://localhost:" + rawPort);
  const adminEmails = optionalEnv("ADMIN_EMAILS", "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  // SendGrid — optional; email features disabled if not configured
  const sendgridApiKey = optionalEnv("SENDGRID_API_KEY");
  const fromEmail = optionalEnv("FROM_EMAIL", "noreply@fixit247.com.au");
  const emailEnabled = Boolean(sendgridApiKey);

  return {
    port,
    nodeEnv,
    appUrl,
    sessionSecret,
    databaseUrl,
    adminEmails,
    sendgrid: {
      enabled: emailEnabled,
      apiKey: sendgridApiKey,
      fromEmail,
      templates: {
        customerWelcome: optionalEnv("SENDGRID_CUSTOMER_WELCOME_TEMPLATE_ID"),
        tradieWelcome: optionalEnv("SENDGRID_TRADIE_WELCOME_TEMPLATE_ID"),
        otp: optionalEnv("SENDGRID_OTP_TEMPLATE_ID"),
      },
    },
  };
}

export const config = buildConfig();
