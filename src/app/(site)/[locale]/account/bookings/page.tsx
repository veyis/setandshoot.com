import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CustomerBookingsPage() {
  const user = await requireUser("/account/bookings");
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "bookings",
    where: { customerId: { equals: user.id } },
    sort: "-createdAt",
    limit: 50,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Your bookings</h1>
      {docs.length === 0 ? (
        <p className="text-neutral-600">You haven&apos;t submitted any bookings yet.</p>
      ) : (
        <ul className="space-y-4">
          {docs.map((doc) => (
            <li key={doc.id} className="rounded-md border p-4">
              <div className="text-sm text-neutral-500">
                {new Date(doc.createdAt).toLocaleString()}
              </div>
              <div className="font-medium">{doc.email}</div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{doc.message}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
