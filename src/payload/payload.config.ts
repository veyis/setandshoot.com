import { buildConfig } from "payload";
import { resendAdapter } from "@payloadcms/email-resend";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Bookings } from "./collections/bookings";
import { Competitions } from "./collections/competitions";
import { Photos } from "./collections/photos";
import { Stories } from "./collections/stories";
import { Tags } from "./collections/tags";
import { Teams } from "./collections/teams";
import { Users } from "./collections/users";
import { AboutPage } from "./globals/about-page";
import { AthletesPage } from "./globals/athletes-page";
import { ContactPage } from "./globals/contact-page";
import { Datenschutz } from "./globals/datenschutz";
import { HighlightsPage } from "./globals/highlights-page";
import { Impressum } from "./globals/impressum";
import { ServicesPage } from "./globals/services-page";
import { Settings } from "./globals/settings";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Cloudflare R2 (S3-compatible) media storage. Stays disabled — falling back to
// Payload's local-disk adapter — until all R2 env vars are present, so local
// dev and CI work without R2 credentials.
const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
const r2Enabled = Boolean(
  process.env.R2_BUCKET &&
  process.env.R2_ENDPOINT &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  r2PublicBaseUrl,
);

const storagePlugins = r2Enabled
  ? [
      s3Storage({
        bucket: process.env.R2_BUCKET as string,
        collections: {
          photos: {
            // Serve directly from the public R2 custom domain instead of
            // streaming through Payload's /api/photos/file/* route.
            disablePayloadAccessControl: true,
            generateFileURL: ({ filename, prefix }) =>
              `${r2PublicBaseUrl}/${prefix ? `${prefix}/` : ""}${filename}`,
          },
        },
        config: {
          endpoint: process.env.R2_ENDPOINT as string,
          region: "auto",
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
          },
        },
      }),
    ]
  : [];

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  secret: process.env.PAYLOAD_SECRET ?? "",
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    components: {
      beforeNavLinks: ["/components/back-to-site#BackToSite"],
    },
  },
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS ?? "noreply@setandshoot.com",
        defaultFromName: process.env.EMAIL_FROM_NAME ?? "Set and Shoot",
      })
    : undefined,
  collections: [Users, Stories, Photos, Teams, Competitions, Tags, Bookings],
  globals: [
    Impressum,
    Datenschutz,
    Settings,
    AboutPage,
    ContactPage,
    ServicesPage,
    AthletesPage,
    HighlightsPage,
  ],
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
    // Keep each serverless instance's pool small so concurrent cold starts
    // don't exhaust Neon's pooler connection ceiling.
    pool: {
      connectionString: process.env.DATABASE_URL ?? "",
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
    schemaName: "payload",
  }),
  plugins: storagePlugins,
  sharp,
});
