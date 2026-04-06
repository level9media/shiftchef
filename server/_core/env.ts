export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL!,
  MYSQL_URL: process.env.MYSQL_URL || process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  ownerOpenId: process.env.OWNER_OPEN_ID || "",
  cookieSecret: process.env.COOKIE_SECRET || process.env.JWT_SECRET!,
} as const;