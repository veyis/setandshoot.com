import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const Bookings: CollectionConfig = {
  slug: "bookings",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "locale", "createdAt"],
    group: "Anfragen",
  },
  hooks: {
    // Until 2026-08-13 a booking was stored and nobody was told, so enquiries
    // sat here until someone happened to open the admin. Resend was already
    // configured — nothing ever called it.
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== "create") return doc;

        const to = (process.env.BOOKING_NOTIFICATION_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);

        if (to.length === 0) {
          req.payload.logger.error(
            "Booking saved but BOOKING_NOTIFICATION_EMAILS is unset — nobody was notified.",
          );
          return doc;
        }

        try {
          await req.payload.sendEmail({
            to,
            subject: `Neue Anfrage · ${doc.name}${doc.organization ? ` (${doc.organization})` : ""}`,
            html: [
              "<h2>Neue Buchungsanfrage</h2>",
              `<p><strong>Name:</strong> ${esc(doc.name)}</p>`,
              `<p><strong>E-Mail:</strong> <a href="mailto:${esc(doc.email)}">${esc(doc.email)}</a></p>`,
              doc.organization ? `<p><strong>Organisation:</strong> ${esc(doc.organization)}</p>` : "",
              `<p><strong>Sprache:</strong> ${esc(doc.locale)}</p>`,
              `<p><strong>Nachricht:</strong></p><pre style="white-space:pre-wrap;font-family:inherit">${esc(doc.message)}</pre>`,
            ]
              .filter(Boolean)
              .join("\n"),
            text:
              `Neue Buchungsanfrage\n\nName: ${doc.name}\nE-Mail: ${doc.email}\n` +
              `${doc.organization ? `Organisation: ${doc.organization}\n` : ""}` +
              `Sprache: ${doc.locale}\n\n${doc.message}`,
          });
        } catch (error) {
          // The booking is already saved. A mail failure must never surface as
          // an error to the customer or roll back their enquiry.
          req.payload.logger.error(
            { err: error },
            "Booking notification email failed — the booking itself was saved.",
          );
        }

        return doc;
      },
    ],
  },
  access: {
    create: () => false,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      minLength: 2,
      maxLength: 120,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "organization",
      type: "text",
      maxLength: 200,
    },
    {
      name: "message",
      type: "textarea",
      required: true,
      minLength: 10,
      maxLength: 5000,
    },
    {
      name: "locale",
      type: "select",
      required: true,
      defaultValue: "de",
      options: [
        { label: "Deutsch", value: "de" },
        { label: "English", value: "en" },
      ],
    },
    {
      name: "customerId",
      type: "text",
      admin: {
        description: "Neon Auth user id (null for anonymous submissions).",
        readOnly: true,
      },
      index: true,
    },
  ],
};
