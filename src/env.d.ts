/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_POCKETBASE_URL: string;
  readonly POCKETBASE_ADMIN_EMAIL: string;
  readonly POCKETBASE_ADMIN_PASSWORD: string;
  readonly POCKETBASE_SERVICE_ROLE_TOKEN?: string;
  readonly DATABASE_URL?: string;
  readonly FEATURE_POCKETBASE_ENABLED?: string;
  readonly POCKETBASE_MIGRATION_LOG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
