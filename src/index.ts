import { OpenAPIHono } from "@hono/zod-openapi";

import { requireAuth } from "./middleware/auth";
import authRouter from "./features/auth/auth.routes";
import AppEnv from "./env";
import { errorHandler } from "./error";
import { createDb } from "./db/db";
import { swaggerUI } from "@hono/swagger-ui";
import { logger } from "hono/logger";
import { appsRouter } from "./features/apps/apps.routes";
import { ReleasesRepository } from "./features/releases/releases.repository";
import { ReleasesService } from "./features/releases/releases.service";
import { StorageRepository } from "./features/upload/storage.repository";
import { UploadRepository } from "./features/upload/uploads.repository";
import { UploadService } from "./features/upload/upload.service";
import uploadRouter from "./features/upload/upload.routes";
import { releasesRouter } from "./features/releases/releases.routes";
import { PatchesService } from "./features/patches/patches.service";
import { PatchesRepository } from "./features/patches/patches.repository";
import { patchesRouter } from "./features/patches/patches.routes";
import { AppsRepository } from "./features/apps/apps.repository";
import { AppService } from "./features/apps/apps.service";
import { corsMiddleware } from "./middleware/cors";

const app = new OpenAPIHono<AppEnv>();

app.onError(errorHandler);
app.use("*", corsMiddleware);
app.use(logger());

app.notFound((c) => {
   const path = new URL(c.req.url).pathname;

  // if startis with /api means to be api based route if not found jsut return custom json
  if (path.startsWith("/api")) {
    return c.json({ message: "Not Found" }, 404);
  }

  // Why proxy the frontend route?
  // Before version have both server and web in one project and deployed as one
  // So cli handle it accordingly to the server url and ping server for login and all
  // FOr backward compatability we will proxy the frontend route to the frontend url
  // Later some point we will remove this proxy and use the frontend url directly
  const frontendUrl = new URL(c.env.FRONTEND_URL!);
  const requestUrl = new URL(c.req.url);

  frontendUrl.pathname = requestUrl.pathname;
  frontendUrl.search = requestUrl.search;

  return fetch(new Request(frontendUrl, c.req.raw));
});

const apiRouter = new OpenAPIHono<AppEnv>();
apiRouter.use("*", (c, next) => {
  const db = createDb(c.env.wingbird_db);
  c.set("db", db);

  const appRepo = new AppsRepository(db);
  const appService = new AppService(appRepo);
  c.set("appService", appService);

  const storageRepo = new StorageRepository({
    accessKeyId: c.env.S3_ACCESS_KEY_ID,
    secretAccessKey: c.env.S3_ACCESS_KEY,
    bucket: c.env.S3_BUCKET,
    expiresSeconds: c.env.S3_PRESIGNED_EXPIRE_SECONDS,
    endpoint: c.env.S3_ENDPOINT,
    region: c.env.S3_REGION,
  });
  const uploadRepo = new UploadRepository(db);
  const uploadService = new UploadService(uploadRepo, storageRepo);
  c.set("uploadService", uploadService);

  const releaseRepo = new ReleasesRepository(db);
  const releaseService = new ReleasesService(releaseRepo, uploadService, c.env.MAX_RELEASES_PER_APP);
  c.set("releaseService", releaseService);

  const patchRepo = new PatchesRepository(db);
  const patchService = new PatchesService(patchRepo, releaseRepo, uploadService, c.env.MAX_PATCHES_PER_RELEASE);
  c.set("patchService", patchService);

  return next();
});

apiRouter.route("/auth", authRouter);
apiRouter.route("/apps", appsRouter);
apiRouter.route("/", uploadRouter);
apiRouter.route("/", releasesRouter);
apiRouter.route("/", patchesRouter);


apiRouter.get("/health", (c) => {
  return c.json({ status: "ok" });
});

apiRouter.get("/whoami", requireAuth, (c) => {
  return c.json({ user: c.get("user") });
});


apiRouter.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Wingbird API",
    version: "1.0.0",
    description: "Wingbird Patch Distribution API",
  },
});

apiRouter.get(
  "/docs",
  swaggerUI({
    url: "/api/openapi.json",
    title: "Wingbird Api"
  }),
);

app.route("/api", apiRouter);


export default app;
