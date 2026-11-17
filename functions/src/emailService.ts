export interface EmailDispatchOptions {
  to: string;
  recipientName?: string;
  subject: string;
  otpCode: string;
  expiresInMinutes: number;
}

export interface EmailDispatchResult {
  provider: "Brevo";
  messageId: string;
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character]);
}

/**
 * Generate a responsive, branded HTML email template for AgriSense BCTB Early Warning.
 */
export function generateOtpEmailHtml(options: EmailDispatchOptions): string {
  const { otpCode, expiresInMinutes } = options;
  const greeting = options.recipientName
    ? `Hello ${escapeHtml(options.recipientName)},`
    : "Hello,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriSense Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f3;
      padding: 32px 12px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
    }
    .header {
      background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
      padding: 28px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #d8f3dc;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }
    .intro-text {
      font-size: 15px;
      color: #4b5563;
      margin-bottom: 24px;
    }
    .otp-box {
      background: #f0fdf4;
      border: 2px dashed #40916c;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      font-weight: 700;
      color: #2d6a4f;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #1b4332;
      margin: 4px 0;
    }
    .otp-expiry {
      font-size: 13px;
      color: #52796f;
      font-weight: 500;
    }
    .security-notice {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 4px;
      margin: 24px 0;
      font-size: 13px;
      color: #92400e;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>AgriSense</h1>
        <p>Uganda Robusta Coffee Decision Support</p>
      </div>
      <div class="content">
        <div class="greeting">${greeting}</div>
        <p class="intro-text">
          Thank you for registering on AgriSense. To verify your email address and activate your agricultural decision support workspace, please enter the following six-digit code:
        </p>
        <div class="otp-box">
          <div class="otp-label">Six-Digit Verification Code</div>
          <div class="otp-code">${otpCode}</div>
          <div class="otp-expiry">Valid for ${expiresInMinutes} minutes only</div>
        </div>
        <div class="security-notice">
          <strong>Security Notice:</strong> AgriSense staff and extension officers will never ask for your verification code. Never share this code with anyone. If you did not initiate this registration, you can safely ignore this email.
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
          Once verified, you will have immediate access to Black Coffee Twig Borer (BCTB) risk screening, AI explanations, agronomic management recommendations, and farm weather alerts.
        </p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} AgriSense Uganda. All rights reserved.<br>
        Empowering Robusta coffee farmers across Mukono, Wakiso, Masaka and greater Uganda.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Deliver a real email; missing configuration and provider failures are explicit. */
export async function sendOtpEmail(
  options: EmailDispatchOptions,
  secrets: { brevoApiKey: string; fromEmail: string },
): Promise<EmailDispatchResult> {
  const { brevoApiKey, fromEmail } = secrets;
  if (!brevoApiKey.trim()) {
    throw new Error("Transactional email is not configured. Set the BREVO_API_KEY secret.");
  }
  if (!fromEmail.trim()) {
    throw new Error("Transactional email sender is not configured. Set AGRISENSE_FROM_EMAIL.");
  }

  const html = generateOtpEmailHtml(options);
  const text = `AgriSense Verification Code: ${options.otpCode}\n\nYour code is valid for ${options.expiresInMinutes} minutes.\nNever share this code with anyone.\n\nAgriSense - Uganda Robusta Coffee Decision Support`;
  let response: Response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "AgriSense Uganda", email: fromEmail },
        to: [{
          email: options.to,
          ...(options.recipientName ? { name: options.recipientName } : {}),
        }],
        subject: options.subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new Error("Brevo could not be reached. The verification email was not sent.", { cause: error });
  }

  if (!response.ok) {
    console.error("Brevo rejected an OTP email.", { status: response.status });
    throw new Error(`The email provider rejected the verification email (HTTP ${response.status}).`);
  }

  const data = await response.json().catch(() => ({})) as { messageId?: string };
  if (!data.messageId) {
    throw new Error("Brevo did not return a delivery ID; the email could not be confirmed.");
  }
  return { provider: "Brevo", messageId: data.messageId };
}
