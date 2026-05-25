import nodemailer from "nodemailer";

// Create transporter (uses env vars; falls back to Ethereal test account in dev)
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  } else {
    // Ethereal test account (logs to console — no real email sent)
    const test = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: test.user, pass: test.pass },
    });
    console.log("📧 Using Ethereal test email. Check console for preview URLs.");
  }
  return transporter;
};

export const sendOTPEmail = async ({ to, name, otp, type }) => {
  const t = await getTransporter();
  const subject =
    type === "reset" ? "PrepAI — Reset Your Password" : "PrepAI — Verify Your Email";

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid #334155">
    <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800">PrepAI</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">AI-Powered Interview Preparation</p>
    </div>
    <div style="padding:36px">
      <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:20px">${type === "reset" ? "Password Reset" : "Verify Your Email"}</h2>
      <p style="color:#94a3b8;margin:0 0 28px;font-size:15px">Hi ${name}, here is your one-time code:</p>
      <div style="background:#0f172a;border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;border:1px solid #334155">
        <span style="font-size:42px;font-weight:900;letter-spacing:10px;color:#a78bfa;font-family:monospace">${otp}</span>
      </div>
      <p style="color:#64748b;font-size:13px;margin:0 0 6px">⏱️ This code expires in <strong style="color:#94a3b8">10 minutes</strong>.</p>
      <p style="color:#64748b;font-size:13px;margin:0">🔒 If you didn't request this, please ignore this email.</p>
    </div>
    <div style="background:#0f172a;padding:20px;text-align:center;border-top:1px solid #334155">
      <p style="color:#475569;font-size:12px;margin:0">© ${new Date().getFullYear()} PrepAI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const info = await t.sendMail({
    from: `"PrepAI" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@prepai.com"}>`,
    to,
    subject,
    html,
  });

  // Log Ethereal preview URL in dev
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`📧 Email preview: ${preview}`);

  return { success: true, messageId: info.messageId };
};
