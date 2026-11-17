import { afterEach, describe, expect, it, vi } from "vitest";
import { generateOtpEmailHtml, sendOtpEmail } from "./emailService";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("transactional OTP email", () => {
  it("escapes account names in the branded email template", () => {
    const html = generateOtpEmailHtml({
      to: "farmer@example.com",
      recipientName: "<img src=x onerror=alert(1)>",
      subject: "AgriSense verification",
      otpCode: "012345",
      expiresInMinutes: 5,
    });

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("012345");
    expect(html).toContain("Valid for 5 minutes");
    expect(html).not.toContain("<img src=x");
  });

  it("reports provider rejection instead of simulating a successful send", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendOtpEmail({
      to: "farmer@example.com",
      subject: "AgriSense verification",
      otpCode: "012345",
      expiresInMinutes: 5,
    }, {
      brevoApiKey: "test-key",
      fromEmail: "verify@example.com",
    })).rejects.toThrow("HTTP 401");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("sends a transactional message through Brevo and requires its message ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ messageId: "message-123" }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendOtpEmail({
      to: "farmer@example.com",
      recipientName: "Harriet",
      subject: "AgriSense verification",
      otpCode: "012345",
      expiresInMinutes: 5,
    }, {
      brevoApiKey: "test-key",
      fromEmail: "verify@example.com",
    })).resolves.toEqual({ provider: "Brevo", messageId: "message-123" });

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(new Headers(request.headers).get("api-key")).toBe("test-key");
    expect(JSON.parse(request.body as string)).toMatchObject({
      sender: { name: "AgriSense Uganda", email: "verify@example.com" },
      to: [{ email: "farmer@example.com", name: "Harriet" }],
      subject: "AgriSense verification",
      textContent: expect.stringContaining("012345"),
    });
  });

  it("does not attempt delivery when provider credentials are absent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendOtpEmail({
      to: "farmer@example.com",
      subject: "AgriSense verification",
      otpCode: "012345",
      expiresInMinutes: 5,
    }, {
      brevoApiKey: "",
      fromEmail: "verify@example.com",
    })).rejects.toThrow("BREVO_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
