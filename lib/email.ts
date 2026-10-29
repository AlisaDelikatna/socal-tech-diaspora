import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Kolo Founders Circle <onboarding@resend.dev>";

// Lazily construct so the app still builds/runs without a key configured.
const resend = apiKey ? new Resend(apiKey) : null;

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/**
 * Sends a transactional email via Resend.
 * If RESEND_API_KEY is not set, logs to the console instead of throwing —
 * this keeps local dev and the MVP build working before email is configured.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping send.\n  to: ${to}\n  subject: ${subject}`
    );
    return false;
  }

  try {
    const { error } = await resend.emails.send({ from, to, subject, html, replyTo });
    if (error) {
      console.error("[email] send failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    // Don't let a failed email break the user-facing flow.
    console.error("[email] send failed:", err);
    return false;
  }
}

/**
 * Sends one individual email per recipient (no shared To: line) using
 * Resend's batch API, 100 at a time. Returns how many were accepted.
 */
export async function sendBulkEmail(
  messages: SendArgs[]
): Promise<number> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping ${messages.length} emails.`);
    return 0;
  }

  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const { data, error } = await resend.batch.send(
        chunk.map((m) => ({ from, ...m }))
      );
      if (error) console.error("[email] batch send failed:", error);
      sent += data?.data.length ?? 0;
    } catch (err) {
      console.error("[email] batch send failed:", err);
    }
  }
  return sent;
}

/** Escapes user-supplied text for safe inclusion in email HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text with line breaks -> escaped HTML paragraphs. */
export function textToHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/** Minimal branded wrapper so all emails look consistent. */
export function emailLayout(bodyHtml: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
    <div style="border-bottom: 3px solid #223A5E; padding-bottom: 12px; margin-bottom: 20px;">
      <span style="font-size: 18px; font-weight: 700; color: #223A5E;">Kolo</span>
      <span style="font-size: 18px; font-weight: 600; color: #6b7280;"> Founders Circle</span>
    </div>
    ${bodyHtml}
    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
      Kolo Founders Circle — Ukrainian tech professionals in Southern California.
    </div>
  </div>`;
}
