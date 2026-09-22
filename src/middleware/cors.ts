

import { cors } from "hono/cors";

export const corsMiddleware = cors({
  origin: (origin, c) => {
    const allowedOrigins = c.env.TRUSTED_ORIGINS
      .split(",")
      .map((value: string) => value.trim())
      .filter(Boolean);

    return allowedOrigins.includes(origin) ? origin : "";
  },

  credentials: true,

  allowHeaders: [
    "Content-Type",
    "Authorization",
  ],

  allowMethods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],
});
