// Minimal Resend HTTP wrapper — avoids a client library dep.

export type SendEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmailViaResend(msg: SendEmail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<{ id: string }>;
}

export function mentionEmail({
  toName,
  fromName,
  brandName,
  taskTitle,
  commentBody,
  url,
}: {
  toName: string;
  fromName: string;
  brandName: string;
  taskTitle: string;
  commentBody: string;
  url: string;
}) {
  const preview =
    commentBody.length > 320 ? commentBody.slice(0, 320) + "…" : commentBody;
  return {
    subject: `${fromName} mentioned you in "${taskTitle}"`,
    text: `${fromName} mentioned you on task "${taskTitle}" in ${brandName}:\n\n${commentBody}\n\nOpen: ${url}\n`,
    html: `<!doctype html><html><body style="font-family: -apple-system, Segoe UI, sans-serif; background: #F5F3EE; color: #111; padding: 32px;">
  <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid rgba(17,17,17,0.1); border-radius: 12px; padding: 28px;">
    <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #7A7A7A; font-weight: 600;">Xentrix · ${brandName}</div>
    <h1 style="font-size: 20px; margin: 8px 0 4px; font-weight: 800;">${fromName} mentioned you</h1>
    <div style="font-size: 14px; color: #4A4A4A;">on task <strong>${taskTitle}</strong></div>
    <blockquote style="margin: 20px 0; padding: 12px 16px; background: #ECE8DF; border-left: 3px solid #FFC801; font-size: 14px; color: #111; white-space: pre-wrap;">${preview}</blockquote>
    <a href="${url}" style="display: inline-block; background: #FFC801; color: #111; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;">Open in dashboard</a>
    <p style="color: #7A7A7A; font-size: 12px; margin: 24px 0 0;">Hi ${toName} — you're getting this because you were @-mentioned. Reply on the task, not this email.</p>
  </div>
</body></html>`,
  };
}

export function magicLinkEmail({ url, host }: { url: string; host: string }) {
  const brand = "Xentrix Master Dashboard";
  return {
    subject: `Sign in to ${brand}`,
    text: `Sign in to ${brand}\n${url}\n\nIf you didn't request this, ignore this email.\n`,
    html: `<!doctype html><html><body style="font-family: -apple-system, Segoe UI, sans-serif; background: #0a0a0a; color: #ededed; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #111; border: 1px solid #262626; border-radius: 12px; padding: 28px;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
      <div style="height: 32px; width: 32px; border-radius: 8px; background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.4); color: #a5b4fc; display: inline-grid; place-items: center; font-weight: 600;">X</div>
      <div>
        <div style="font-size: 12px; color: #9ca3af;">Xentrix</div>
        <div style="font-size: 14px; font-weight: 500;">Master Dashboard</div>
      </div>
    </div>
    <h1 style="font-size: 20px; margin: 0 0 8px;">Sign in to ${host}</h1>
    <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 20px;">Click the button below to sign in. The link expires in 24 hours and can only be used once.</p>
    <a href="${url}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px;">Sign in</a>
    <p style="color: #737373; font-size: 12px; margin: 24px 0 0;">If you didn't request this email, you can safely ignore it.</p>
  </div>
</body></html>`,
  };
}
