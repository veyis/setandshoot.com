import { z } from "zod";

export const bookingInquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  organization: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10).max(5000),
  locale: z.enum(["de", "en"]).default("de"),
});

export type BookingInquiryInput = z.infer<typeof bookingInquirySchema>;
