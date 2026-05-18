import { describe, it, expect } from "vitest";
import { bookingInquirySchema } from "@/lib/booking/schema";

describe("bookingInquirySchema", () => {
  it("accepts a valid inquiry", () => {
    const result = bookingInquirySchema.parse({
      name: "Alex Meyer",
      email: "alex@example.com",
      message: "We would like to book match coverage.",
      locale: "de",
    });
    expect(result.organization).toBeUndefined();
  });

  it("rejects a short message", () => {
    expect(() =>
      bookingInquirySchema.parse({
        name: "Alex Meyer",
        email: "alex@example.com",
        message: "short",
        locale: "en",
      }),
    ).toThrow();
  });
});
