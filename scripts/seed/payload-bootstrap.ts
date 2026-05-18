// scripts/seed/payload-bootstrap.ts
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";
import config from "@payload-config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.PAYLOAD_CONFIG_PATH ??= path.resolve(dirname, "../../src/payload/payload.config.ts");

export async function getSeedPayload() {
  return getPayload({ config });
}

export const SEEDS_DIR = path.resolve(dirname, "../../public/media/seeds");
