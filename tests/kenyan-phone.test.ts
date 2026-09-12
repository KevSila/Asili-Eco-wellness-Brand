import { describe, expect, it } from "vitest";
import { normalizeKenyanPhoneNumber } from "../src/server/lib/kenyan-phone";

describe("Kenyan phone normalization", () => {
  it.each([
    ["0712 345 678", "+254712345678"],
    ["0712345678", "+254712345678"],
    ["712345678", "+254712345678"],
    ["254712345678", "+254712345678"],
    ["+254712345678", "+254712345678"],
    ["(0712) 345-678", "+254712345678"],
    ["0112 345 678", "+254112345678"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeKenyanPhoneNumber(input)).toBe(expected);
  });

  it.each([
    "",
    "0201234567",
    "071234567",
    "+255712345678",
    "0712ABC678",
  ])("rejects %s", (input) => {
    expect(normalizeKenyanPhoneNumber(input)).toBeNull();
  });
});
