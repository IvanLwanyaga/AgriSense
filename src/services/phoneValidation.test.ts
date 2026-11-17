import { describe, it, expect } from "vitest";
import {
  isValidUgandaPhone,
  normalizeUgandaPhone,
  detectUgandaCarrier,
  buildLocalizedSmsMessage,
} from "./smsService";

describe("Uganda Cellular Phone Validation & Normalization", () => {
  it("accepts valid MTN Uganda numbers", () => {
    expect(isValidUgandaPhone("+256772123456")).toBe(true);
    expect(isValidUgandaPhone("0772123456")).toBe(true);
    expect(isValidUgandaPhone("0782998877")).toBe(true);
    expect(isValidUgandaPhone("+256 76 123 4567")).toBe(true);
    expect(detectUgandaCarrier("+256772123456")).toBe("MTN Uganda");
    expect(detectUgandaCarrier("0782998877")).toBe("MTN Uganda");
  });

  it("accepts valid Airtel Uganda numbers", () => {
    expect(isValidUgandaPhone("+256701883210")).toBe(true);
    expect(isValidUgandaPhone("0701883210")).toBe(true);
    expect(isValidUgandaPhone("0752112233")).toBe(true);
    expect(isValidUgandaPhone("+256 74 000 1111")).toBe(true);
    expect(detectUgandaCarrier("+256701883210")).toBe("Airtel Uganda");
    expect(detectUgandaCarrier("0752112233")).toBe("Airtel Uganda");
  });

  it("rejects invalid country codes or landlines", () => {
    expect(isValidUgandaPhone("+254712345678")).toBe(false); // Kenya
    expect(isValidUgandaPhone("+14155552671")).toBe(false);  // US
    expect(isValidUgandaPhone("0414123456")).toBe(false);    // Landline
    expect(isValidUgandaPhone("invalid-phone")).toBe(false);
    expect(isValidUgandaPhone("")).toBe(false);
  });

  it("normalizes phone formats correctly to +2567XXXXXXXX", () => {
    expect(normalizeUgandaPhone("0772123456")).toBe("+256772123456");
    expect(normalizeUgandaPhone("256701883210")).toBe("+256701883210");
    expect(normalizeUgandaPhone("+256 782 998 877")).toBe("+256782998877");
  });

  it("enforces GSM-7 160-character length limit on localized messages", () => {
    const enMsg = buildLocalizedSmsMessage("Kato", "Mukono Coffee Farm", "High BCTB risk detected", "en");
    expect(enMsg.length).toBeLessThanOrEqual(160);
    expect(enMsg).toContain("[AgriSense Alert]");

    const lgMsg = buildLocalizedSmsMessage("Nalule", "Kyampisi Farm", "Obulwadde bwa BCTB bususse", "lg");
    expect(lgMsg.length).toBeLessThanOrEqual(160);
    expect(lgMsg).toContain("Omusiri");

    const swMsg = buildLocalizedSmsMessage("Juma", "Shamba Bora", "Hatari kubwa ya mdudu wa kahawa", "sw");
    expect(swMsg.length).toBeLessThanOrEqual(160);
    expect(swMsg).toContain("Shamba");

    const nynMsg = buildLocalizedSmsMessage("Mugisha", "Ibanda Farm", "BCTB eri aha mutindo gwa waggulu", "nyn");
    expect(nynMsg.length).toBeLessThanOrEqual(160);
    expect(nynMsg).toContain("Omusiri");
  });
});

