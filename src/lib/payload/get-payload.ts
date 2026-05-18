import { getPayload as getPayloadFn } from "payload";
import config from "@/payload/payload.config";

let cached: Promise<Awaited<ReturnType<typeof getPayloadFn>>> | null = null;

export function getPayload() {
  if (!cached) {
    cached = getPayloadFn({ config });
  }
  return cached;
}
