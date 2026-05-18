import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
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
import { Datenschutz } from "./globals/datenschutz";
import { Impressum } from "./globals/impressum";
import { Settings } from "./globals/settings";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  secret: process.env.PAYLOAD_SECRET ?? "",
  admin: {
    user: Users.slug,
  },
  collections: [Users, Stories, Photos, Teams, Competitions, Tags, Bookings],
  globals: [Impressum, Datenschutz, Settings],
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
  // TODO: re-enable object storage with a non-Supabase S3 provider (or Vercel Blob)
  // in a separate task. Media falls back to local disk for now.
  plugins: [],
  sharp,
});
