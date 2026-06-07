import express from "express";
import crypto  from "crypto";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import * as resp from "../utils/apiResponse.js";

const router = express.Router();

/* ── POST /api/payment/create-order ─────────────────────────────── */
router.post("/create-order", protect, async (req, res) => {
  try {
    const { plan = "monthly", amount } = req.body;
    const amountInPaise = amount || (plan === "yearly" ? 359400 : 49900);

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    console.log(`[Payment] create-order — plan: ${plan}, amount: ${amountInPaise} paise, keyId: ${keyId ? keyId.slice(0,12)+"..." : "NOT SET"}`);

    if (keyId && keySecret) {
      try {
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Basic ${authHeader}` },
          body: JSON.stringify({
            amount:   amountInPaise,
            currency: "INR",
            receipt:  `prepai_${req.user._id}_${Date.now()}`,
            notes:    { userId: String(req.user._id), plan },
          }),
        });

        if (orderRes.ok) {
          const order = await orderRes.json();
          console.log(`[Payment] ✅ Razorpay order created: ${order.id}`);
          return resp.success(res, { orderId: order.id, amount: amountInPaise, currency: "INR", real: true });
        }

        const errBody = await orderRes.text();
        console.error(`[Payment] ❌ Razorpay order API error ${orderRes.status}:`, errBody);
      } catch (e) {
        console.error("[Payment] ❌ Razorpay order fetch failed:", e.message);
      }
    } else {
      console.warn("[Payment] ⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set — returning null orderId");
    }

    // Return null orderId — frontend handles this gracefully (test/demo mode)
    console.log("[Payment] Returning null orderId — no real Razorpay order created");
    return resp.success(res, { orderId: null, amount: amountInPaise, currency: "INR", real: false });

  } catch (err) {
    console.error("[Payment] create-order unhandled error:", err.message);
    return resp.error(res, "Failed to create payment order.", 500);
  }
});

/* ── POST /api/payment/verify ────────────────────────────────────── */
router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let verified = false;

    if (keySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      // Real signature verification
      const expectedSig = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      verified = expectedSig === razorpay_signature;
    } else if (razorpay_payment_id) {
      // Dev/test mode — accept any payment ID
      verified = true;
    }

    if (!verified) {
      return resp.error(res, "Payment verification failed. Invalid signature.", 400);
    }

    // Upgrade user to premium
    const premiumExpiry = plan === "yearly"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() +  30 * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(req.user._id, {
      isPremium:      true,
      premiumPlan:    plan || "monthly",
      premiumExpiry,
      premiumPaymentId: razorpay_payment_id,
      premiumActivatedAt: new Date(),
    });

    return resp.success(res, { isPremium: true, plan, expiry: premiumExpiry }, "Premium activated successfully!");
  } catch (err) {
    console.error(err);
    return resp.error(res, "Payment verification error.", 500);
  }
});

/* ── GET /api/payment/status ─────────────────────────────────────── */
router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("isPremium premiumPlan premiumExpiry");
    if (!user) return resp.error(res, "User not found.", 404);
    // Auto-expire if past date
    if (user.isPremium && user.premiumExpiry && user.premiumExpiry < new Date()) {
      await User.findByIdAndUpdate(req.user._id, { isPremium: false });
      return resp.success(res, { isPremium: false });
    }
    return resp.success(res, { isPremium: user.isPremium, plan: user.premiumPlan, expiry: user.premiumExpiry });
  } catch (err) {
    return resp.error(res, "Failed to fetch subscription status.", 500);
  }
});

export default router;
