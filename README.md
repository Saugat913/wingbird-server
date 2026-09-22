# Wingbird Server

Backend API for Wingbird, an open-source code-patching system for Flutter Android applications.

> **Status:** Experimental / beta. The service is under active development and should be hardened and reviewed before production use.

## Responsibilities

- Expose the Wingbird HTTP API.
- Authenticate users and provide the authenticated-user endpoint.
- Manage applications, releases, and patches.
- Handle upload workflows and artifact storage.
- Store application metadata using Cloudflare D1 and Drizzle ORM.
- Generate OpenAPI documentation and expose Swagger UI.

## Technology stack

- Hono and `@hono/zod-openapi`
- Cloudflare Workers with Wrangler
- Cloudflare D1
- Drizzle ORM and Drizzle Kit
- Better Auth
- S3-compatible storage through `aws4fetch`
- TypeScript

## Project structure

```text
src/
├── db/          Database setup and schema access
├── features/
│   ├── apps/    Application management
│   ├── auth/    Authentication routes and logic
│   ├── patches/ Patch operations
│   ├── releases/Release operations
│   └── upload/  Upload and object-storage operations
├── lib/         Shared libraries
├── middleware/  Request middleware and authentication
├── types/       Shared application types
├── env.ts       Environment bindings and validation
├── error.ts     Error handling
└── index.ts     Worker entry point and route composition
```

## API endpoints

The application mounts its API under `/api` and currently exposes:

- `/api/health` — health check returning `{ "status": "ok" }`
- `/api/whoami` — authenticated-user endpoint
- `/api/openapi.json` — OpenAPI document
- `/api/docs` — Swagger UI
- Authentication, application, upload, release, and patch routes

The exact request and response schemas are defined in the route modules and OpenAPI definitions in `src/features`.

## Local development

Install dependencies:

```bash
npm install
```

Run the Wrangler development server:

```bash
npm run dev
```

Generate Cloudflare binding types:

```bash
npm run cf-typegen
```

Database commands:

```bash
npm run db:generate
npm run db:migrate:local
npm run db:migrate:remote
```

Build and deploy:

```bash
npm run build
npm run deploy
```

Configure local variables using `.dev.vars.example` and configure the Cloudflare bindings and secrets required by `wrangler.jsonc`. Do not commit real credentials or production secrets.

## Related repositories

- [wingbird](https://github.com/Saugat913/wingbird) — Rust CLI
- [wingbird-sdk](https://github.com/Saugat913/wingbird-sdk) — Flutter SDK and native patching layer
- [wingbird-backup](https://github.com/Saugat913/wingbird-backup) — original consolidated repository

## License

Apache-2.0
