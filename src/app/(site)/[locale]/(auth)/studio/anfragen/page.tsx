import { getTranslations } from "next-intl/server";
import { listStudioBookings } from "@/lib/studio/bookings";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function StudioBookingsPage() {
  // Layouts render in parallel with pages — re-check here, not just in the layout.
  await requireAdmin("/studio");
  const t = await getTranslations("studio");
  const bookings = await listStudioBookings();

  return (
    <main>
      <h2 className="font-display mb-4 text-xl tracking-tight">{t("bookingsTitle")}</h2>
      {bookings.length === 0 ? (
        <p className="text-ink-muted">{t("bookingsEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="border-hairline rounded-md border p-4">
              <div className="text-ink-muted flex flex-wrap justify-between gap-2 text-sm">
                <span>{new Date(booking.createdAt).toLocaleString("de-DE")}</span>
                <span className="font-mono text-xs uppercase">{booking.locale}</span>
              </div>
              <div className="mt-1 font-medium">
                {booking.name} · {booking.email}
              </div>
              {booking.organization ? (
                <div className="text-ink-muted text-sm">{booking.organization}</div>
              ) : null}
              <p className="mt-2 text-sm whitespace-pre-wrap">{booking.message}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
