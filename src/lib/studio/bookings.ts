import "server-only";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import type { Booking } from "@/payload-types";

export async function listStudioBookings(): Promise<Booking[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "bookings",
    sort: "-createdAt",
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });
  return docs;
}
