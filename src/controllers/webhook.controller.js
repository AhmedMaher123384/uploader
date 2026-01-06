const { ApiError } = require("../utils/apiError");
const { hmacSha256Hex, timingSafeEqualHex, sha256Hex } = require("../utils/hash");
const WebhookLog = require("../models/WebhookLog");
const { findMerchantByMerchantId, markMerchantUninstalled, upsertInstalledMerchant } = require("../services/merchant.service");
const { Buffer } = require("buffer");

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

function createWebhookController(config) {
  async function sallaWebhook(req, res) {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const signature = String(req.headers["x-salla-signature"] || "").trim();
    const authHeader = String(req.headers.authorization || "").trim();
    const securityStrategy = String(req.headers["x-salla-security-strategy"] || "").trim().toLowerCase();
    const secret = config.salla.webhookSecret;

    if (!secret) throw new ApiError(500, "Webhook secret is not configured", { code: "SALLA_WEBHOOK_SECRET_MISSING" });

    if (signature) {
      const computed = hmacSha256Hex(secret, rawBody);
      if (!timingSafeEqualHex(signature, computed)) {
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
