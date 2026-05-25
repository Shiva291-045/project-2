import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async ({ to, name, otp, type }) => {
  try {
    const subject =
      type === "reset"
        ? "PrepAI - Reset Password OTP"
        : "PrepAI - Verify Your Email";

    const html = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>PrepAI OTP Verification</h2>
        <p>Hello ${name},</p>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
      </div>
    `;

    
    const data = await resend.emails.send({
  from: "onboarding@resend.dev",
  to: to,
  subject: subject,
  html: html,
});

console.log("EMAIL RESPONSE:", data);

    console.log("✅ Email sent:", data);

    return data;
  } catch (error) {
    console.error("❌ Resend Email Error:", error);
    throw error;
  }
};