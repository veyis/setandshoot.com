import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Users } from "./collections/users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  secret: process.env.PAYLOAD_SECRET ?? "",
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  globals: [],
  editor: lexicalEditor({}),
  localization: {
    locales: [
      { label: "Deutsch", code: "de" },
      { label: "English", code: "en" },
    ],
    defaultLocale: "de",
    fallback: true,
  },
  typescript: {
    outputFile: path.resolve(dirname, "../../payload-types.ts"),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? "" },
    schemaName: "payload",
  }),
  plugins: [
    s3Storage({
      enabled: false,
      collections: {},
      bucket: process.env.SUPABASE_S3_BUCKET ?? "",
      config: {
        endpoint: process.env.SUPABASE_S3_ENDPOINT ?? "",
        credentials: {
          accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY ?? "",
        },
        region: process.env.SUPABASE_S3_REGION ?? "us-east-1",
        forcePathStyle: true,
      },
    }),
  ],
  sharp,
});
