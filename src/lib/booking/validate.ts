import { bookingInquirySchema } from "@/lib/booking/schema";

export type BookingFieldErrors = Partial<
  Record<"name" | "email" | "message" | "organization", string>
>;

/** Client-side, per-field validation reusing the server schema. */
export function validateBookingFields(input: {
  name: string;
  email: string;
  message: string;
  organization?: string;
}): BookingFieldErrors {
  const result = bookingInquirySchema.safeParse({ ...input, locale: "de" });
  if (result.success) return {};
  const errors: BookingFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (key === "name" || key === "email" || key === "message" || key === "organization") {
      errors[key] ??= issue.message;
    }
  }
  return errors;
}
