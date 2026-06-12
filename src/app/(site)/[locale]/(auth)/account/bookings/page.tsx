import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPayload } from "@/lib/payload/get-payload";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CustomerBookingsPage() {
  const user = await requireUser("/account/bookings");
  const t = await getTranslations("account");
  const payload = await getPayload();
  const { docs } = await payload.find({
    collection: "bookings",
    where: { customerId: { equals: user.id } },
    sort: "-createdAt",
    limit: 50,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 pt-32 pb-16">
      <p className="mb-6 text-sm">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/account" as any}
          className="text-ink-muted hover:text-ink transition-colors"
        >
          ← {t("backToAccount")}
        </Link>
      </p>
      <h1 className="font-display mb-6 text-3xl tracking-tight">{t("bookingsTitle")}</h1>
      {docs.length === 0 ? (
        <p className="text-ink-muted">{t("bookingsEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {docs.map((doc) => (
            <li key={doc.id} className="border-hairline rounded-md border p-4">
              <div className="text-ink-muted text-sm">
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
