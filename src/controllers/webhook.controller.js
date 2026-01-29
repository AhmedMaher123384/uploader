const { ApiError } = require("../utils/apiError");
const { hmacSha256Hex, timingSafeEqualHex, sha256Hex } = require("../utils/hash");
const WebhookLog = require("../models/WebhookLog");
const { findMerchantByMerchantId, markMerchantUninstalled, upsertInstalledMerchant } = require("../services/merchant.service");
const { Buffer } = require("buffer");
const crypto = require("crypto");

function extractEvent(req, payload) {
  const headerEvent = req.headers["x-salla-event"] || req.headers["x-salla-topic"] || req.headers["x-event"];
  return String(headerEvent || payload?.event || payload?.type || "").trim() || "unknown";
}

function extractMerchantId(payload) {
  const candidates = [
    payload?.merchant,
    payload?.merchant?.id,
    payload?.data?.merchant?.id,
    payload?.store?.id,
    payload?.data?.store?.id,
    payload?.store_id,
    payload?.data?.store_id
  ];
  for (const c of candidates) {
    const v = String(c || "").trim();
    if (v) return v;
  }
  return null;
}

function extractDeliveryId(req, payload) {
  const candidates = [
    req.headers["x-salla-delivery-id"],
    req.headers["x-delivery-id"],
    req.headers["x-request-id"],
    payload?.delivery_id,
    payload?.deliveryId,
    payload?.id,
    payload?.event_id,
    payload?.eventId
  ];
  for (const c of candidates) {
    const v = String(c || "").trim();
    if (v) return v;
  }
  return null;
}

function parseDateValue(v) {
  if (v == null) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "number" && Number.isFinite(v) && v > 0) {
    const ms = v > 2_000_000_000_000 ? v : v * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(v || "").trim();
  if (!s) return null;
  const asNum = Number(s);
  if (Number.isFinite(asNum) && asNum > 0) return parseDateValue(asNum);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizePlanKey(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return null;
  if (s === "basic" || s === "pro" || s === "business") return s;
  if (s.includes("business")) return "business";
  if (s.includes("pro")) return "pro";
  if (s.includes("basic")) return "basic";
  return null;
}

function extractSubscription(payload) {
  const data = payload && payload.data ? payload.data : null;
  const sub = data && typeof data === "object" ? data.subscription || data.sub || null : null;
  const root = sub && typeof sub === "object" ? sub : data;
  if (!root || typeof root !== "object") return null;

  const planCandidates = [
    root.planKey,
    root.plan_key,
    root.plan && root.plan.key,
    root.plan && root.plan.slug,
    root.plan && root.plan.code,
    root.plan && root.plan.name,
    root.plan_name
  ];

  const planKey = planCandidates.map(normalizePlanKey).find(Boolean) || null;

  const endCandidates = [
    root.current_period_end,
    root.currentPeriodEnd,
    root.end_date,
    root.endDate,
    root.ends_at,
    root.endsAt,
    root.expires_at,
    root.expiresAt,
    root.expired_at,
    root.expiredAt,
    root.renew_at,
    root.renewAt,
    root.renewed_at,
    root.renewedAt
  ];
  const currentPeriodEnd = endCandidates.map(parseDateValue).find(Boolean) || null;

  const statusCandidates = [root.status, root.state, root.subscription_status, root.subscriptionStatus];
  const status = statusCandidates.map((x) => String(x || "").trim().toLowerCase()).find(Boolean) || null;

  const idCandidates = [root.id, root.subscription_id, root.subscriptionId];
  const subscriptionId = idCandidates.map((x) => String(x || "").trim()).find(Boolean) || null;

  return { planKey, currentPeriodEnd, status, subscriptionId, raw: root };
}

function normalizeSignatureCandidates(signatureValue) {
  const raw = String(signatureValue || "").trim();
  if (!raw) return [];
  const parts = raw.split(/\s+/g).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const s = String(p || "").trim();
    if (!s) continue;
    const cleaned = s.toLowerCase().startsWith("sha256=") ? s.slice("sha256=".length).trim() : s;
    if (cleaned) out.push(cleaned.toLowerCase());
  }
  return out;
}

function matchesSignature(sig, expected) {
  const a = String(sig || "").trim().toLowerCase();
  const b = String(expected || "").trim().toLowerCase();
  if (!a || !b) return false;
  if (a.length === b.length) return timingSafeEqualHex(a, b);
  if (a.length < b.length && b.startsWith(a)) return timingSafeEqualHex(a, b.slice(0, a.length));
  if (b.length < a.length && a.startsWith(b)) return timingSafeEqualHex(a.slice(0, b.length), b);
  return false;
}

function verifySallaSignature(secret, rawBody, signatureHeader) {
  const sigs = normalizeSignatureCandidates(signatureHeader);
  if (!sigs.length) return false;

  const secretBuf = Buffer.from(String(secret || ""), "utf8");
  const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ""), "utf8");

  const expected = [
    hmacSha256Hex(secret, bodyBuf),
    crypto.createHash("sha256").update(Buffer.concat([secretBuf, bodyBuf])).digest("hex"),
    crypto.createHash("sha256").update(Buffer.concat([bodyBuf, secretBuf])).digest("hex")
  ].map((x) => String(x || "").trim().toLowerCase());

  for (const sig of sigs) {
    for (const exp of expected) {
      if (matchesSignature(sig, exp)) return true;
    }
  }
  return false;
}

function createWebhookController(config) {
  async function sallaWebhook(req, res) {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const signature = String(req.headers["x-salla-signature"] || "").trim();
    const authHeader = String(req.headers.authorization || "").trim();
    const securityStrategy = String(req.headers["x-salla-security-strategy"] || "").trim().toLowerCase();
    const secret = config.salla.webhookSecret;

    if (!secret) throw new ApiError(500, "Webhook secret is not configured", { code: "SALLA_WEBHOOK_SECRET_MISSING" });

    if (signature) {
      if (!verifySallaSignature(secret, rawBody, signature)) {
        throw new ApiError(401, "Invalid webhook signature", { code: "SALLA_WEBHOOK_SIGNATURE_INVALID" });
      }
    } else if (securityStrategy === "token") {
      if (!authHeader) throw new ApiError(401, "Missing webhook authorization", { code: "SALLA_WEBHOOK_AUTH_MISSING" });
      const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : authHeader;
      if (token !== secret) {
        throw new ApiError(401, "Invalid webhook authorization", { code: "SALLA_WEBHOOK_AUTH_INVALID" });
      }
    } else {
      throw new ApiError(401, "Missing webhook signature", { code: "SALLA_WEBHOOK_SIGNATURE_MISSING" });
    }

    const bodyText = rawBody.toString("utf8") || "{}";
    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      throw new ApiError(400, "Invalid JSON payload", { code: "INVALID_JSON" });
    }

    const event = extractEvent(req, payload);
    const payloadHash = sha256Hex(bodyText);
    const merchantIdString = extractMerchantId(payload);
    const deliveryId = extractDeliveryId(req, payload);

    const alreadyProcessed = await WebhookLog.findOne(
      deliveryId ? { event, deliveryId, status: "processed" } : { event, payloadHash, status: "processed" }
    ).lean();
    if (alreadyProcessed) return res.status(200).json({ ok: true });

    const logBase = {
      event,
      deliveryId: deliveryId || undefined,
      payloadHash,
      status: "received",
      createdAt: new Date()
    };

    let merchant = null;
    if (merchantIdString) {
      merchant = await findMerchantByMerchantId(merchantIdString);
      if (merchant) logBase.merchantId = merchant._id;
    }

    await WebhookLog.create(logBase);

    try {
      if (event === "app.store.authorize") {
        if (!merchantIdString) throw new ApiError(400, "Missing merchant id", { code: "MERCHANT_ID_MISSING" });

        const accessToken = String(payload?.data?.access_token || "").trim();
        const refreshToken = String(payload?.data?.refresh_token || "").trim();
        const expires = Number(payload?.data?.expires || 0);

        if (!accessToken) throw new ApiError(400, "Missing access_token", { code: "ACCESS_TOKEN_MISSING" });
        if (!refreshToken) throw new ApiError(400, "Missing refresh_token", { code: "REFRESH_TOKEN_MISSING" });
        if (!Number.isFinite(expires) || expires <= 0) throw new ApiError(400, "Missing expires", { code: "TOKEN_EXPIRES_MISSING" });

        const tokenExpiresAt = new Date(expires * 1000);
        merchant = await upsertInstalledMerchant({
          merchantId: merchantIdString,
          accessToken,
          refreshToken,
          tokenExpiresAt
        });
      }

      if (event.startsWith("app.subscription.") || event.startsWith("app.trial.")) {
        if (!merchantIdString) throw new ApiError(400, "Missing merchant id", { code: "MERCHANT_ID_MISSING" });
        if (!merchant) merchant = await findMerchantByMerchantId(merchantIdString);
        if (merchant) {
          const sub = extractSubscription(payload);
          const prevMeta = merchant.planMeta && typeof merchant.planMeta === "object" ? merchant.planMeta : {};
          const prevSub = prevMeta.subscription && typeof prevMeta.subscription === "object" ? prevMeta.subscription : {};

          const isExpiredEvent =
            event === "app.subscription.expired" ||
            event === "app.subscription.canceled" ||
            event === "app.subscription.cancelled" ||
            event === "app.trial.expired" ||
            event === "app.trial.canceled" ||
            event === "app.trial.cancelled";

          const nextPlanKey = isExpiredEvent ? "basic" : normalizePlanKey(sub && sub.planKey);

          merchant.planMeta = {
            ...prevMeta,
            subscription: {
              ...prevSub,
              event,
              subscriptionId: sub ? sub.subscriptionId : prevSub.subscriptionId || null,
              status: sub ? sub.status : prevSub.status || null,
              currentPeriodEnd: sub && sub.currentPeriodEnd ? sub.currentPeriodEnd : prevSub.currentPeriodEnd || null,
              updatedAt: new Date(),
              raw: sub ? sub.raw : prevSub.raw || null
            }
          };

          if (nextPlanKey && nextPlanKey !== merchant.planKey) {
            merchant.planKey = nextPlanKey;
            merchant.planUpdatedAt = new Date();
          }

          await merchant.save();
        }
      }

      if (event === "app.installed" && merchant && merchant.appStatus !== "installed") {
        merchant.appStatus = "installed";
        await merchant.save();
      }

      if (event === "app.uninstalled" || event === "app.deleted") {
        if (merchantIdString) await markMerchantUninstalled(merchantIdString);
      }

      await WebhookLog.create({
        merchantId: merchant?._id,
        event,
        deliveryId: deliveryId || undefined,
        payloadHash,
        status: "processed",
        createdAt: new Date()
      });

      return res.status(200).json({ ok: true });
    } catch (err) {
      await WebhookLog.create({
        merchantId: merchant?._id,
        event,
        deliveryId: deliveryId || undefined,
        payloadHash,
        status: "failed",
        errorCode: err?.code || err?.name || "WEBHOOK_FAILED",
        createdAt: new Date()
      }).catch(() => undefined);
      throw err;
    }
  }

  return { sallaWebhook };
}

module.exports = {
  createWebhookController
};
