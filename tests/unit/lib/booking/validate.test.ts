import { describe, expect, it } from "vitest";
import { validateBookingFields } from "@/lib/booking/validate";

describe("validateBookingFields", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateBookingFields({ name: "Belin A", email: "a@b.de", message: "Hello there team" }),
    ).toEqual({});
  });
  it("flags short name, bad email, short message by field", () => {
    const errs = validateBookingFields({ name: "B", email: "nope", message: "hi" });
    expect(errs.name).toBeTruthy();
    expect(errs.email).toBeTruthy();
    expect(errs.message).toBeTruthy();
  });
});
