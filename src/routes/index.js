const express = require("express");
const Joi = require("joi");
const { merchantAuth } = require("../middlewares/merchantAuth.middleware");
const { createOAuthRouter } = require("./oauth.routes");
const { validate } = require("../middlewares/validate.middleware");
const { listProducts, getProductById, getProductVariant, getStoreInfo } = require("../services/sallaApi.service");
const { refreshAccessToken } = require("../services/sallaOAuth.service");
const { ApiError } = require("../utils/apiError");
const { fetchVariantsSnapshotReport } = require("../services/sallaCatalog.service");
const { findMerchantByMerchantId } = require("../services/merchant.service");
const { hmacSha256, sha256Hex } = require("../utils/hash");
const { Buffer } = require("buffer");
const { URL } = require("url");
const crypto = require("crypto");
const axios = require("axios");
const { readSnippetCss } = require("../storefront/snippet/styles");
const mountMediaPlatform = require("../storefront/snippet/features/mediaPlatform/media.mount");
const MediaAsset = require("../models/MediaAsset");
const Merchant = require("../models/Merchant");

function createApiRouter(config) {
  const router = express.Router();
  const publicCache = new Map();
  const mediaPolicyCache = new Map();

  function cacheGet(key) {
    const hit = publicCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      publicCache.delete(key);
      return null;
    }
    return hit.value;
  }

  function cacheSet(key, value, ttlMs) {
    publicCache.set(key, { value, expiresAt: Date.now() + Math.max(0, Number(ttlMs || 0)) });
  }

  function base64UrlEncodeUtf8(input) {
    return Buffer.from(String(input || ""), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function base64UrlDecodeUtf8(input) {
    const raw = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
    const pad = raw.length % 4 ? "=".repeat(4 - (raw.length % 4)) : "";
    return Buffer.from(`${raw}${pad}`, "base64").toString("utf8");
  }

  function timingSafeEqualString(a, b) {
    const aBuf = Buffer.from(String(a || ""), "utf8");
    const bBuf = Buffer.from(String(b || ""), "utf8");
    if (aBuf.length !== bBuf.length) return false;
    return require("crypto").timingSafeEqual(aBuf, bBuf);
  }

  function buildCanonicalQueryString(query, delimiter) {
    const keys = Object.keys(query || {})
      .filter((k) => !["signature", "hmac"].includes(String(k || "").toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    const parts = [];
    for (const key of keys) {
      const raw = query[key];
      const value = Array.isArray(raw) ? raw.map((v) => String(v)).join(",") : String(raw);
      parts.push(`${key}=${value}`);
    }
    return parts.join(delimiter);
  }

  function ensureValidProxySignature(query) {
    const secret = config?.salla?.clientSecret || config?.salla?.webhookSecret;
    if (!secret) throw new ApiError(500, "Proxy secret is not configured", { code: "PROXY_SECRET_MISSING" });

    const signature = String(query?.signature ?? query?.hmac ?? "").trim();
    if (!signature) throw new ApiError(401, "Missing proxy signature", { code: "PROXY_SIGNATURE_MISSING" });

    const canonicalAmp = buildCanonicalQueryString(query, "&");
    const canonicalPlain = buildCanonicalQueryString(query, "");

    const candidates = [
      hmacSha256(secret, canonicalAmp, "hex"),
      hmacSha256(secret, canonicalPlain, "hex"),
      hmacSha256(secret, canonicalAmp, "base64"),
      hmacSha256(secret, canonicalPlain, "base64")
    ];

    const ok = candidates.some((cand) => timingSafeEqualString(signature, cand));
    if (!ok) throw new ApiError(401, "Invalid proxy signature", { code: "PROXY_SIGNATURE_INVALID" });
  }

  function issueStorefrontToken(merchantId) {
    const secret = config?.salla?.clientSecret || config?.salla?.webhookSecret;
    if (!secret) throw new ApiError(500, "Proxy secret is not configured", { code: "PROXY_SECRET_MISSING" });
    const payload = JSON.stringify({
      merchantId: String(merchantId || "").trim(),
      iat: Date.now(),
      nonce: sha256Hex(`${Date.now()}:${Math.random()}`).slice(0, 12)
    });
    const payloadB64 = base64UrlEncodeUtf8(payload);
    const sig = hmacSha256(secret, payloadB64, "hex");
    return `${payloadB64}.${sig}`;
  }

  function ensureValidStorefrontToken(token, expectedMerchantId) {
    const secret = config?.salla?.clientSecret || config?.salla?.webhookSecret;
    if (!secret) throw new ApiError(500, "Proxy secret is not configured", { code: "PROXY_SECRET_MISSING" });

    const raw = String(token || "").trim();
    const [payloadB64, sig] = raw.split(".");
    if (!payloadB64 || !sig) throw new ApiError(401, "Invalid proxy signature", { code: "PROXY_SIGNATURE_INVALID" });

    const computed = hmacSha256(secret, String(payloadB64), "hex");
    if (!timingSafeEqualString(String(sig), String(computed))) {
      throw new ApiError(401, "Invalid proxy signature", { code: "PROXY_SIGNATURE_INVALID" });
    }

    let payload = null;
    try {
      payload = JSON.parse(base64UrlDecodeUtf8(payloadB64));
    } catch {
      throw new ApiError(401, "Invalid proxy signature", { code: "PROXY_SIGNATURE_INVALID" });
    }

    const merchantId = String(payload?.merchantId || "").trim();
    const iat = Number(payload?.iat || 0);
    if (!merchantId || !Number.isFinite(iat) || iat <= 0) {
      throw new ApiError(401, "Invalid proxy signature", { code: "PROXY_SIGNATURE_INVALID" });
    }

    const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
    if (iat < Date.now() - maxAgeMs) throw new ApiError(401, "Invalid proxy signature", { code: "PROXY_SIGNATURE_INVALID" });

    const expected = String(expectedMerchantId || "").trim();
    if (expected && merchantId !== expected) throw new ApiError(401, "Invalid proxy signature", { code: "PROXY_SIGNATURE_INVALID" });
  }

  function ensureValidProxyAuth(query, expectedMerchantId) {
    const token = String(query?.token || "").trim();
    if (token) return ensureValidStorefrontToken(token, expectedMerchantId);
    return ensureValidProxySignature(query);
  }

  async function ensureMerchantTokenFresh(merchant) {
    const skewMs = Math.max(0, Number(config.security.tokenRefreshSkewSeconds || 0)) * 1000;
    const expiresAtMs = merchant.tokenExpiresAt ? new Date(merchant.tokenExpiresAt).getTime() : 0;
    const shouldRefresh = !expiresAtMs || expiresAtMs <= Date.now() + skewMs;
    if (shouldRefresh) await refreshAccessToken(config.salla, merchant);
  }

  const storefrontSnippetQuerySchema = Joi.object({
    merchantId: Joi.string().trim().min(1).max(80).required()
  }).unknown(true);

  router.get("/storefront/snippet.js", async (req, res, next) => {
    try {
      const { error, value } = storefrontSnippetQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const merchantId = String(value.merchantId);
      const isSandboxMerchant = merchantId === "sandbox";
      if (!isSandboxMerchant) {
        const merchant = await findMerchantByMerchantId(merchantId);
        if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });
        if (merchant.appStatus !== "installed") throw new ApiError(403, "Merchant is not active", { code: "MERCHANT_INACTIVE" });
      }

      const token = isSandboxMerchant ? "sandbox" : issueStorefrontToken(merchantId);

      res.type("js");
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
      const { cssBase, cssPickers, cssTraditional } = readSnippetCss();
      const context = { parts: [], merchantId, token, cssBase, cssPickers, cssTraditional };
      mountMediaPlatform(context);
      const js = context.parts.join("");
      res.setHeader("X-BundleApp-Snippet-Path", "/api/storefront/snippet.js");
      res.setHeader("X-BundleApp-Snippet-Sha256", sha256Hex(js));
      res.setHeader("X-BundleApp-Snippet-Bytes", String(Buffer.byteLength(js, "utf8")));
      return res.send(js);
    } catch (err) {
      return next(err);
    }
  });

  router.use("/oauth/salla", createOAuthRouter(config));

  function requireCloudinaryConfig() {
    const cloudName = String(config?.cloudinary?.cloudName || "").trim();
    const apiKey = String(config?.cloudinary?.apiKey || "").trim();
    const apiSecret = String(config?.cloudinary?.apiSecret || "").trim();
    const folderPrefix = String(config?.cloudinary?.folderPrefix || "bundle_app").trim() || "bundle_app";
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ApiError(500, "Cloudinary is not configured", { code: "CLOUDINARY_NOT_CONFIGURED" });
    }
    return { cloudName, apiKey, apiSecret, folderPrefix };
  }

  function cloudinarySign(params, apiSecret) {
    const entries = Object.entries(params || {})
      .filter(([, v]) => v != null && String(v) !== "")
      .map(([k, v]) => [String(k), Array.isArray(v) ? v.map((x) => String(x)).join(",") : String(v)])
      .sort(([a], [b]) => a.localeCompare(b));
    const base = entries.map(([k, v]) => `${k}=${v}`).join("&");
    return crypto.createHash("sha1").update(`${base}${apiSecret}`, "utf8").digest("hex");
  }

  function mediaFolderForMerchant(folderPrefix, merchantId) {
    const m = String(merchantId || "").trim();
    const p = String(folderPrefix || "").trim();
    const cleanP = p.replace(/\/+$/g, "");
    return `${cleanP}/${m}`;
  }

  function serializeMediaAsset(doc) {
    if (!doc) return null;
    return {
      id: String(doc._id),
      merchantId: String(doc.merchantId),
      storeId: String(doc.storeId),
      resourceType: doc.resourceType,
      publicId: doc.publicId,
      assetId: doc.assetId || null,
      folder: doc.folder || null,
      originalFilename: doc.originalFilename || null,
      format: doc.format || null,
      bytes: doc.bytes != null ? Number(doc.bytes) : null,
      width: doc.width != null ? Number(doc.width) : null,
      height: doc.height != null ? Number(doc.height) : null,
      duration: doc.duration != null ? Number(doc.duration) : null,
      url: doc.url || null,
      secureUrl: doc.secureUrl || null,
      thumbnailUrl: doc.thumbnailUrl || null,
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      context: doc.context || null,
      cloudinaryCreatedAt: doc.cloudinaryCreatedAt ? new Date(doc.cloudinaryCreatedAt).toISOString() : null,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null
    };
  }

  function getPlanKey(merchant) {
    const v = String(merchant?.planKey || "").trim().toLowerCase();
    if (v === "pro" || v === "business") return v;
    return "basic";
  }

  function bytesFromMb(mb) {
    return Math.floor(Math.max(0, Number(mb || 0)) * 1024 * 1024);
  }

  function bytesFromGb(gb) {
    return Math.floor(Math.max(0, Number(gb || 0)) * 1024 * 1024 * 1024);
  }

  function getPlanLimits(planKey) {
    const k = String(planKey || "").trim().toLowerCase();
    if (k === "pro") {
      return {
        maxFileBytes: bytesFromMb(30),
        maxStorageBytes: bytesFromGb(20),
        linkLeafLength: 16
      };
    }
    if (k === "business") {
      return {
        maxFileBytes: bytesFromMb(50),
        maxStorageBytes: bytesFromGb(50),
        linkLeafLength: 9
      };
    }
    return {
      maxFileBytes: bytesFromMb(10),
      maxStorageBytes: bytesFromGb(5),
      linkLeafLength: 24
    };
  }

  const bannedExt = new Set(["exe", "js", "mjs", "cjs", "php", "phtml", "html", "htm", "sh", "bat", "cmd", "ps1", "jar", "com", "scr", "msi"]);

  function normalizeFilenameExt(name) {
    const s = String(name || "").trim();
    if (!s) return "";
    const lastDot = s.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === s.length - 1) return "";
    const raw = s.slice(lastDot + 1).trim().toLowerCase();
    return raw.replace(/[^a-z0-9]+/g, "");
  }

  function normalizeResourceTypeFromFile(fileType, ext) {
    const t = String(fileType || "").trim().toLowerCase();
    const e = String(ext || "").trim().toLowerCase();
    if (t.startsWith("video/")) return "video";
    if (t.startsWith("image/")) return "image";
    if (["mp4", "webm"].includes(e)) return "video";
    if (["jpg", "jpeg", "png", "webp", "avif", "gif", "tif", "tiff", "svg", "bmp", "heic", "heif"].includes(e)) return "image";
    return "raw";
  }

  function getAllowedExtForPlan(planKey) {
    const k = String(planKey || "").trim().toLowerCase();
    const base = new Set(["gif", "pdf", "jpg", "jpeg", "png", "webp", "avif", "mp4", "webm"]);
    if (k === "pro") {
      const proOnly = ["css", "zip", "json", "otf", "tiff", "tif", "svg", "ttf", "woff", "woff2", "eot"];
      for (const x of proOnly) base.add(x);
      return base;
    }
    if (k === "business") {
      return null;
    }
    return base;
  }

  function randomLeaf(length) {
    const len = Math.max(6, Math.min(64, Number(length || 0) || 0));
    const out = [];
    while (out.join("").length < len) {
      const chunk = crypto.randomBytes(24).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      out.push(chunk);
    }
    return out.join("").slice(0, len);
  }

  async function getStoreUsedBytesCached(storeId) {
    const key = `used:${String(storeId || "").trim()}`;
    const hit = mediaPolicyCache.get(key);
    if (hit && hit.expiresAt > Date.now()) return Number(hit.value || 0) || 0;

    const agg = await MediaAsset.aggregate(
      [
        { $match: { storeId: String(storeId), deletedAt: null } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$bytes", 0] } } } }
      ],
      { allowDiskUse: true }
    );
    const used = Number(agg?.[0]?.total || 0) || 0;
    mediaPolicyCache.set(key, { value: used, expiresAt: Date.now() + 5000 });
    return used;
  }

  async function validateUploadPolicyOrThrow({ merchant, file, resourceTypeHint }) {
    const planKey = getPlanKey(merchant);
    const limits = getPlanLimits(planKey);

    const fileName = String(file?.name || "").trim();
    const fileSize = Number(file?.size || 0) || 0;
    const fileType = String(file?.type || "").trim();

    if (!fileName) throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });
    if (!Number.isFinite(fileSize) || fileSize <= 0) throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });

    if (fileSize > limits.maxFileBytes) {
      throw new ApiError(403, "File size limit exceeded", { code: "FILE_SIZE_LIMIT_EXCEEDED", details: { maxBytes: limits.maxFileBytes } });
    }

    let ext = normalizeFilenameExt(fileName);
    if (!ext) {
      const t = String(fileType || "").trim().toLowerCase();
      if (t === "image/png") ext = "png";
    }
    if (ext && bannedExt.has(ext)) throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });

    const allowed = getAllowedExtForPlan(planKey);
    if (allowed && ext && !allowed.has(ext)) {
      throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
    }

    if (planKey !== "pro" && planKey !== "business" && ext === "svg") {
      throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
    }

    const resourceType = normalizeResourceTypeFromFile(fileType, ext);
    if (resourceTypeHint) {
      const hinted = String(resourceTypeHint).trim();
      if (hinted && hinted !== resourceType) {
        void hinted;
      }
    }

    const storeId = String(merchant?.merchantId || "").trim();
    const used = await getStoreUsedBytesCached(storeId);
    if (used + fileSize > limits.maxStorageBytes) {
      throw new ApiError(403, "Storage limit exceeded", {
        code: "STORAGE_LIMIT_EXCEEDED",
        details: { maxBytes: limits.maxStorageBytes, usedBytes: used }
      });
    }

    return { planKey, limits, ext, resourceType };
  }

  function svgLooksSafe(text) {
    const s = String(text || "");
    if (!s) return false;
    if (/<script\b/i.test(s)) return false;
    if (/<foreignObject\b/i.test(s)) return false;
    if (/\bon\w+\s*=/i.test(s)) return false;
    if (/\bhref\s*=\s*["']\s*javascript:/i.test(s)) return false;
    if (/\bxlink:href\s*=\s*["']\s*javascript:/i.test(s)) return false;
    if (/\bhref\s*=\s*["']\s*(https?:|data:|\/\/)/i.test(s)) return false;
    if (/\bxlink:href\s*=\s*["']\s*(https?:|data:|\/\/)/i.test(s)) return false;
    return true;
  }

  async function ensureSvgSafeOrThrow(url) {
    const u = String(url || "").trim();
    if (!u) throw new ApiError(403, "Invalid SVG", { code: "SVG_INVALID" });
    let resp = null;
    try {
      resp = await axios.get(u, {
        timeout: 12000,
        responseType: "text",
        maxContentLength: 512 * 1024,
        maxBodyLength: 512 * 1024,
        headers: { "Accept": "image/svg+xml,text/plain,*/*" }
      });
    } catch (e) {
      throw new ApiError(403, "Invalid SVG", { code: "SVG_INVALID", details: { message: String(e?.message || e) } });
    }
    const body = typeof resp?.data === "string" ? resp.data : "";
      if (!svgLooksSafe(body)) throw new ApiError(403, "Invalid SVG", { code: "SVG_INVALID" });
  }

  function cloudinaryUrlWithTransform(url, transform) {
    const u = String(url || "").trim();
    const t = String(transform || "").trim();
    if (!u || !t) return u;
    const idx = u.indexOf("/upload/");
    if (idx < 0) return u;
    const before = u.slice(0, idx + "/upload/".length);
    const after = u.slice(idx + "/upload/".length);
    if (after.startsWith(t + "/")) return u;
    return `${before}${t}/${after}`;
  }

  function placeholderSvg(storeId) {
    const sid = String(storeId || "").trim();
    const label = sid ? `Store ${sid}` : "Store";
    const now = new Date().toISOString();
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#18b5d5"/><stop offset="1" stop-color="#0b1220"/>' +
      "</linearGradient></defs>" +
      '<rect width="100%" height="100%" fill="url(#g)"/>' +
      '<rect x="40" y="40" width="1120" height="550" rx="28" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.25)"/>' +
      '<text x="80" y="150" font-family="ui-sans-serif,system-ui,Segoe UI,Arial" font-size="54" font-weight="900" fill="#ffffff">BundleApp</text>' +
      `<text x="80" y="230" font-family="ui-sans-serif,system-ui,Segoe UI,Arial" font-size="28" font-weight="800" fill="rgba(255,255,255,0.92)">${label}</text>` +
      `<text x="80" y="540" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="18" font-weight="700" fill="rgba(255,255,255,0.8)">${now}</text>` +
      "</svg>"
    );
  }

  function pickHostFromUrlLike(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      return new URL(raw).hostname || "";
    } catch {
      return "";
    }
  }

  function hostMatches(needleHost, allowedHost) {
    const n = String(needleHost || "").trim().toLowerCase();
    const a = String(allowedHost || "").trim().toLowerCase();
    if (!n || !a) return false;
    if (n === a) return true;
    return n.endsWith(`.${a}`);
  }

  const mediaDeliveryParamsSchema = Joi.object({
    storeId: Joi.string().trim().min(1).max(80).required(),
    leaf: Joi.string().trim().min(6).max(64).required()
  });

  const mediaDeliveryBuckets = new Map();
  function rateLimitMediaDeliveryOrThrow(req, storeId) {
    const windowMs = Math.max(1000, Number(config?.security?.rateLimitWindowMs || 60_000));
    const maxRequests = Math.max(1, Number(config?.security?.rateLimitMaxRequests || 120));
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const key = `m:${String(storeId || "").trim()}:${String(ip)}`;
    const now = Date.now();
    const existing = mediaDeliveryBuckets.get(key);
    if (!existing || existing.resetAt <= now) {
      mediaDeliveryBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    existing.count += 1;
    if (existing.count > maxRequests) throw new ApiError(429, "Too many requests", { code: "RATE_LIMITED" });
  }

  router.get("/m/:storeId/:leaf", validate(mediaDeliveryParamsSchema, "params"), async (req, res, next) => {
    try {
      const storeId = String(req.params.storeId);
      const leaf = String(req.params.leaf);

      rateLimitMediaDeliveryOrThrow(req, storeId);

      const merchant = await findMerchantByMerchantId(storeId);
      if (!merchant) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      let stage = "normal";
      if (merchant.appStatus !== "installed") {
        const startMs = merchant.updatedAt ? new Date(merchant.updatedAt).getTime() : Date.now();
        const elapsed = Math.max(0, Date.now() - (Number.isFinite(startMs) ? startMs : Date.now()));
        const d14 = 14 * 24 * 60 * 60 * 1000;
        const d30 = 30 * 24 * 60 * 60 * 1000;
        const d45 = 45 * 24 * 60 * 60 * 1000;
        if (elapsed < d14) stage = "normal";
        else if (elapsed < d14 + d30) stage = "watermark";
        else if (elapsed < d14 + d30 + d45) stage = "placeholder";
        else stage = "blocked";
      }

      if (stage === "blocked") {
        return res.status(410).type("text/plain; charset=utf-8").send("Gone");
      }
      if (stage === "placeholder") {
        res.status(200);
        res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=60");
        return res.send(placeholderSvg(storeId));
      }

      const token = String(req.query?.token || "").trim();
      if (storeId === "sandbox" && token === "sandbox") {
        void token;
      } else {
        if (!token) throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });
        ensureValidStorefrontToken(token, storeId);
      }

      const storeInfo = await getPublicStoreInfo(storeId);
      const domain =
        (storeInfo && storeInfo.domain ? String(storeInfo.domain).trim() : "") ||
        (merchant && merchant.storeDomain ? String(merchant.storeDomain).trim() : "");
      const storeUrlHost =
        (storeInfo && storeInfo.url ? pickHostFromUrlLike(storeInfo.url) : "") ||
        (merchant && merchant.storeUrl ? pickHostFromUrlLike(merchant.storeUrl) : "");

      const originHost = pickHostFromUrlLike(req.headers.origin);
      const refererHost = pickHostFromUrlLike(req.headers.referer);
      const h = originHost || refererHost;
      if (!h) throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });

      const allowedHosts = [domain, storeUrlHost, "localhost", "127.0.0.1"].filter(Boolean);
      const ok = allowedHosts.some((a) => hostMatches(h, a));
      if (!ok) throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });

      const { folderPrefix } = requireCloudinaryConfig();
      const folder = mediaFolderForMerchant(folderPrefix, storeId);
      const publicId = `${folder}/${leaf}`;
      let asset = await MediaAsset.findOne({ storeId, publicId, deletedAt: null }).lean();
      if (!asset) {
        const escapedLeaf = String(leaf).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        asset = await MediaAsset.findOne({ storeId, deletedAt: null, publicId: new RegExp(`/${escapedLeaf}$`) }).lean();
      }
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const baseUrl = String(asset.secureUrl || asset.url || "").trim();
      if (!baseUrl) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      let nextUrl = baseUrl;
      if (stage === "watermark" && String(asset.resourceType) === "image") {
        const wm = "l_text:arial_48:BundleApp,g_south_east,x_18,y_18,co_white,o_70,bo_2px_solid_black";
        nextUrl = cloudinaryUrlWithTransform(baseUrl, wm);
      }

      const range = String(req.headers.range || "").trim();
      const upstreamHeaders = {};
      if (range) upstreamHeaders.Range = range;

      let upstream = null;
      try {
        upstream = await axios.get(nextUrl, {
          responseType: "stream",
          timeout: 15000,
          maxRedirects: 3,
          headers: upstreamHeaders,
          validateStatus: () => true
        });
      } catch (e) {
        throw new ApiError(502, "Bad gateway", { code: "BAD_GATEWAY", details: { message: String(e?.message || e) } });
      }

      const status = Number(upstream?.status || 502);
      if (status >= 400) {
        throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
      }

      const passHeaders = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"];
      for (const k of passHeaders) {
        const v = upstream.headers ? upstream.headers[k] : null;
        if (v != null) res.setHeader(k, v);
      }
      res.setHeader("Cache-Control", "public, max-age=300");
      res.status(status);
      upstream.data.pipe(res);
      return;
    } catch (err) {
      return next(err);
    }
  });

  async function cloudinaryDestroyByPublicId({ resourceType, publicId }) {
    const { cloudName, apiKey, apiSecret } = requireCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinarySign({ public_id: String(publicId), timestamp }, apiSecret);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${String(resourceType)}/destroy`;
    const body = new URLSearchParams();
    body.set("public_id", String(publicId));
    body.set("api_key", apiKey);
    body.set("timestamp", String(timestamp));
    body.set("signature", signature);

    await axios.post(url, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000
    });
  }

  function normalizeSallaStoreInfo(raw) {
    if (!raw || typeof raw !== "object") return null;
    const data = raw && typeof raw === "object" ? (raw.data && typeof raw.data === "object" ? raw.data : raw) : null;
    const store = data && typeof data === "object"
      ? (data.store && typeof data.store === "object" ? data.store : data.merchant && typeof data.merchant === "object" ? data.merchant : data)
      : null;
    if (!store || typeof store !== "object") return null;

    function pickUrl(v) {
      if (!v) return null;
      if (typeof v === "string") return String(v).trim() || null;
      if (typeof v === "object") {
        const url = v.url ?? v.src ?? v.original ?? v.full ?? v.large ?? v.medium ?? v.small ?? v.path ?? null;
        return url != null ? String(url).trim() || null : null;
      }
      return null;
    }

    function pickFirstUrl(...values) {
      for (const v of values) {
        if (Array.isArray(v)) {
          for (const item of v) {
            const u = pickUrl(item);
            if (u) return u;
          }
          continue;
        }
        const u = pickUrl(v);
        if (u) return u;
      }
      return null;
    }

    const id = store.id != null ? String(store.id) : null;
    const name =
      store.name != null ? String(store.name) : store.store_name != null ? String(store.store_name) : store.storeName != null ? String(store.storeName) : null;
    const domain =
      store.domain != null
        ? String(store.domain)
        : Array.isArray(store.domains) && store.domains.length
          ? String(store.domains[0])
          : null;
    const url = store.url != null ? String(store.url) : store.website != null ? String(store.website) : null;

    const logoUrl = pickFirstUrl(store.logo, store.logo_url, store.logoUrl, store.avatar, store.image, store.images, store.media);

    return { id, name, domain, url, logoUrl };
  }

  async function getPublicStoreInfo(storeId) {
    const sid = String(storeId || "").trim();
    if (!sid) return null;

    const cacheKey = `public:storeInfo:${sid}`;
    const cached = cacheGet(cacheKey);
    if (cached === "__NULL__") return null;
    if (cached) return cached;

    try {
      const merchant = await findMerchantByMerchantId(sid);
      if (!merchant || merchant.appStatus !== "installed") {
        cacheSet(cacheKey, "__NULL__", 10 * 60 * 1000);
        return null;
      }

      await ensureMerchantTokenFresh(merchant);
      const raw = await getStoreInfo(config.salla, merchant.accessToken);
      const normalized = normalizeSallaStoreInfo(raw);
      if (normalized && typeof normalized === "object") {
        const nextName = normalized.name != null ? String(normalized.name).trim() || null : null;
        const nextDomain = normalized.domain != null ? String(normalized.domain).trim() || null : null;
        const nextUrl = normalized.url != null ? String(normalized.url).trim() || null : null;
        const changed =
          (nextName && nextName !== merchant.storeName) ||
          (nextDomain && nextDomain !== merchant.storeDomain) ||
          (nextUrl && nextUrl !== merchant.storeUrl);
        if (changed) {
          merchant.storeName = nextName || merchant.storeName || null;
          merchant.storeDomain = nextDomain || merchant.storeDomain || null;
          merchant.storeUrl = nextUrl || merchant.storeUrl || null;
          await merchant.save();
        }
      }
      cacheSet(cacheKey, normalized || "__NULL__", 6 * 60 * 60 * 1000);
      return normalized || null;
    } catch {
      cacheSet(cacheKey, "__NULL__", 10 * 60 * 1000);
      return null;
    }
  }

  const mediaSignatureBodySchema = Joi.object({
    resourceType: Joi.string().valid("image", "video", "raw").default("image"),
    tags: Joi.array().items(Joi.string().trim().min(1).max(50)).max(20).default([]),
    context: Joi.object().unknown(true).default({}),
    file: Joi.object({
      name: Joi.string().trim().min(1).max(200).required(),
      size: Joi.number().integer().min(1).required(),
      type: Joi.string().trim().max(150).allow("").default("")
    }).required()
  }).required();

  router.post("/media/signature", merchantAuth(config), async (req, res, next) => {
    try {
      const { error, value } = mediaSignatureBodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const { cloudName, apiKey, apiSecret, folderPrefix } = requireCloudinaryConfig();
      const merchantId = String(req.merchant?.merchantId || "").trim();
      const folder = mediaFolderForMerchant(folderPrefix, merchantId);
      const timestamp = Math.floor(Date.now() / 1000);

      const policy = await validateUploadPolicyOrThrow({ merchant: req.merchant, file: value.file, resourceTypeHint: value.resourceType });
      const leaf = randomLeaf(policy.limits.linkLeafLength);
      const publicId = leaf;

      const context = value.context && typeof value.context === "object" ? value.context : {};
      const contextParts = [];
      for (const [k, v] of Object.entries(context)) {
        const key = String(k || "").trim();
        if (!key) continue;
        const val = String(v == null ? "" : v).trim();
        if (!val) continue;
        contextParts.push(`${key}=${val}`);
      }
      const contextStr = contextParts.length ? contextParts.join("|") : null;

      const tags = Array.isArray(value.tags) ? value.tags.map((t) => String(t).trim()).filter(Boolean) : [];
      const tagsStr = tags.length ? tags.join(",") : null;

      const paramsToSign = {
        folder,
        timestamp,
        public_id: publicId,
        ...(contextStr ? { context: contextStr } : {}),
        ...(tagsStr ? { tags: tagsStr } : {})
      };
      const signature = cloudinarySign(paramsToSign, apiSecret);

      return res.json({
        ok: true,
        cloudinary: {
          cloudName,
          apiKey,
          resourceType: policy.resourceType,
          uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${policy.resourceType}/upload`,
          folder,
          publicId,
          timestamp,
          signature,
          ...(contextStr ? { context: contextStr } : {}),
          ...(tagsStr ? { tags: tagsStr } : {})
        }
      });
    } catch (err) {
      return next(err);
    }
  });

  const mediaRecordBodySchema = Joi.object({
    cloudinary: Joi.object({
      public_id: Joi.string().trim().min(1).required(),
      asset_id: Joi.string().trim().min(1).allow(null),
      resource_type: Joi.string().trim().valid("image", "video", "raw").required(),
      secure_url: Joi.string().uri().allow(null),
      url: Joi.string().uri().allow(null),
      bytes: Joi.number().integer().min(0).allow(null),
      format: Joi.string().trim().allow(null),
      width: Joi.number().integer().min(0).allow(null),
      height: Joi.number().integer().min(0).allow(null),
      duration: Joi.number().min(0).allow(null),
      original_filename: Joi.string().trim().allow(null),
      folder: Joi.string().trim().allow(null),
      tags: Joi.array().items(Joi.string()).default([]),
      context: Joi.object().unknown(true).allow(null),
      created_at: Joi.string().trim().allow(null)
    })
      .unknown(true)
      .required()
  }).required();

  router.post("/media/assets", merchantAuth(config), async (req, res, next) => {
    try {
      const { error, value } = mediaRecordBodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const merchantId = String(req.merchant?.merchantId || "").trim();
      const storeId = merchantId;
      const c = value.cloudinary || {};

      const planKey = getPlanKey(req.merchant);
      const limits = getPlanLimits(planKey);
      const allowed = getAllowedExtForPlan(planKey);
      let fileExt = normalizeFilenameExt(c.original_filename);
      if (!fileExt) {
        const fmt = String(c.format || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
        if (fmt) fileExt = fmt;
      }
      if (fileExt && bannedExt.has(fileExt)) throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
      if (allowed && fileExt && !allowed.has(fileExt)) throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
      if ((planKey !== "pro" && planKey !== "business") && String(c.format || "").toLowerCase() === "svg") {
        throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
      }

      const prev = await MediaAsset.findOne({ storeId, publicId: String(c.public_id), deletedAt: null }).lean();
      const used = await getStoreUsedBytesCached(storeId);
      const prevBytes = Number(prev?.bytes || 0) || 0;
      const nextBytes = Number(c.bytes || 0) || 0;
      if (nextBytes > limits.maxFileBytes) throw new ApiError(403, "File size limit exceeded", { code: "FILE_SIZE_LIMIT_EXCEEDED" });
      if (used - prevBytes + nextBytes > limits.maxStorageBytes) throw new ApiError(403, "Storage limit exceeded", { code: "STORAGE_LIMIT_EXCEEDED" });

      if (String(c.format || "").toLowerCase() === "svg") {
        const urlToCheck = String(c.secure_url || c.url || "").trim();
        await ensureSvgSafeOrThrow(urlToCheck);
      }

      const createdAt = c.created_at ? new Date(String(c.created_at)) : null;
      const cloudinaryCreatedAt = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null;

      const contextObj = c.context && typeof c.context === "object" ? c.context : null;
      const ctx = contextObj && typeof contextObj.custom === "object" ? contextObj.custom : contextObj;

      const doc = await MediaAsset.findOneAndUpdate(
        { storeId, publicId: String(c.public_id), deletedAt: null },
        {
          $set: {
            merchantId,
            storeId,
            resourceType: String(c.resource_type),
            publicId: String(c.public_id),
            assetId: c.asset_id ? String(c.asset_id) : null,
            folder: c.folder ? String(c.folder) : null,
            originalFilename: c.original_filename ? String(c.original_filename) : null,
            format: c.format ? String(c.format) : null,
            bytes: c.bytes != null ? Number(c.bytes) : null,
            width: c.width != null ? Number(c.width) : null,
            height: c.height != null ? Number(c.height) : null,
            duration: c.duration != null ? Number(c.duration) : null,
            url: c.url ? String(c.url) : null,
            secureUrl: c.secure_url ? String(c.secure_url) : null,
            thumbnailUrl: c.secure_url ? String(c.secure_url) : null,
            tags: Array.isArray(c.tags) ? c.tags.map((t) => String(t)).filter(Boolean) : [],
            context: ctx || null,
            cloudinaryCreatedAt,
            cloudinary: c
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json({ ok: true, asset: serializeMediaAsset(doc) });
    } catch (err) {
      return next(err);
    }
  });

  const mediaListQuerySchema = Joi.object({
    storeId: Joi.string().trim().min(1).max(80),
    resourceType: Joi.string().trim().valid("image", "video", "raw"),
    q: Joi.string().trim().max(120),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(24)
  }).unknown(true);

  router.get("/media/assets", merchantAuth(config), async (req, res, next) => {
    try {
      const { error, value } = mediaListQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const merchantId = String(req.merchant?.merchantId || "").trim();
      const storeId = String(value.storeId || "").trim() || merchantId;
      if (storeId !== merchantId) {
        throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
      }

      const filter = { storeId, deletedAt: null };
      if (value.resourceType) filter.resourceType = String(value.resourceType);
      if (value.q) {
        const q = String(value.q);
        filter.$or = [{ publicId: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }];
      }

      const page = Number(value.page);
      const limit = Number(value.limit);
      const skip = (page - 1) * limit;

      const [total, docs] = await Promise.all([
        MediaAsset.countDocuments(filter),
        MediaAsset.find(filter).sort({ cloudinaryCreatedAt: -1, createdAt: -1 }).skip(skip).limit(limit)
      ]);

      let storeInfo = null;
      try {
        const raw = await getStoreInfo(config.salla, req.merchantAccessToken);
        storeInfo = normalizeSallaStoreInfo(raw);
      } catch (err) {
        void err;
      }

      return res.json({
        ok: true,
        merchant: {
          merchantId,
          appStatus: String(req.merchant?.appStatus || ""),
          createdAt: req.merchant?.createdAt ? new Date(req.merchant.createdAt).toISOString() : null,
          updatedAt: req.merchant?.updatedAt ? new Date(req.merchant.updatedAt).toISOString() : null
        },
        store: {
          storeId,
          info: storeInfo
        },
        storeId,
        page,
        limit,
        total,
        items: docs.map(serializeMediaAsset)
      });
    } catch (err) {
      return next(err);
    }
  });

  const mediaSyncBodySchema = Joi.object({
    resourceType: Joi.string().trim().valid("image", "video", "raw", "all").default("all"),
    maxResults: Joi.number().integer().min(1).max(500).default(100)
  }).required();

  router.post("/media/sync", merchantAuth(config), async (req, res, next) => {
    try {
      const { error, value } = mediaSyncBodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const { cloudName, apiKey, apiSecret, folderPrefix } = requireCloudinaryConfig();
      const merchantId = String(req.merchant?.merchantId || "").trim();
      const storeId = merchantId;
      const folder = mediaFolderForMerchant(folderPrefix, merchantId);

      const types = value.resourceType === "all" ? ["image", "video"] : [String(value.resourceType)];
      const maxResults = Number(value.maxResults);

      const upserted = [];
      const errors = [];

      for (const resourceType of types) {
        let remaining = maxResults - upserted.length;
        if (remaining <= 0) break;

        let nextCursor = null;
        while (remaining > 0) {
          const payload = {
            expression: `folder:${folder} AND resource_type:${resourceType}`,
            max_results: Math.min(100, remaining)
          };
          if (nextCursor) payload.next_cursor = nextCursor;

          let resp = null;
          try {
            resp = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, payload, {
              auth: { username: apiKey, password: apiSecret },
              timeout: 15000
            });
          } catch (e) {
            errors.push({ resourceType, message: String(e?.response?.data?.error?.message || e?.message || e) });
            break;
          }

          const resources = Array.isArray(resp?.data?.resources) ? resp.data.resources : [];
          for (const r of resources) {
            const createdAt = r.created_at ? new Date(String(r.created_at)) : null;
            const cloudinaryCreatedAt = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null;

            const contextObj = r.context && typeof r.context === "object" ? r.context : null;
            const ctx = contextObj && typeof contextObj.custom === "object" ? contextObj.custom : contextObj;

            const doc = await MediaAsset.findOneAndUpdate(
              { storeId, publicId: String(r.public_id), deletedAt: null },
              {
                $set: {
                  merchantId,
                  storeId,
                  resourceType: String(r.resource_type),
                  publicId: String(r.public_id),
                  assetId: r.asset_id ? String(r.asset_id) : null,
                  folder: r.folder ? String(r.folder) : null,
                  originalFilename: r.original_filename ? String(r.original_filename) : null,
                  format: r.format ? String(r.format) : null,
                  bytes: r.bytes != null ? Number(r.bytes) : null,
                  width: r.width != null ? Number(r.width) : null,
                  height: r.height != null ? Number(r.height) : null,
                  duration: r.duration != null ? Number(r.duration) : null,
                  url: r.url ? String(r.url) : null,
                  secureUrl: r.secure_url ? String(r.secure_url) : null,
                  thumbnailUrl: r.secure_url ? String(r.secure_url) : null,
                  tags: Array.isArray(r.tags) ? r.tags.map((t) => String(t)).filter(Boolean) : [],
                  context: ctx || null,
                  cloudinaryCreatedAt,
                  cloudinary: r
                }
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            upserted.push(doc);
            remaining -= 1;
            if (remaining <= 0) break;
          }

          nextCursor = String(resp?.data?.next_cursor || "").trim() || null;
          if (!nextCursor || !resources.length || remaining <= 0) break;
        }
      }

      return res.json({
        ok: true,
        storeId,
        folder,
        requested: maxResults,
        synced: upserted.length,
        errors
      });
    } catch (err) {
      return next(err);
    }
  });

  const mediaDeleteParamsSchema = Joi.object({
    id: Joi.string().trim().min(10).required()
  });

  router.delete("/media/assets/:id", merchantAuth(config), validate(mediaDeleteParamsSchema, "params"), async (req, res, next) => {
    try {
      const { cloudName, apiKey, apiSecret } = requireCloudinaryConfig();
      const merchantId = String(req.merchant?.merchantId || "").trim();
      const storeId = merchantId;
      const id = String(req.params.id);

      const asset = await MediaAsset.findOne({ _id: id, storeId, deletedAt: null });
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const timestamp = Math.floor(Date.now() / 1000);
      const signature = cloudinarySign({ public_id: String(asset.publicId), timestamp }, apiSecret);

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/${String(asset.resourceType)}/destroy`;
      const body = new URLSearchParams();
      body.set("public_id", String(asset.publicId));
      body.set("api_key", apiKey);
      body.set("timestamp", String(timestamp));
      body.set("signature", signature);

      await axios.post(url, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000
      });

      asset.deletedAt = new Date();
      await asset.save();

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  function requireMediaAdminKey(req) {
    const configured = String(config?.security?.mediaAdminKey || "").trim();
    if (!configured) throw new ApiError(500, "Media admin key is not configured", { code: "MEDIA_ADMIN_KEY_MISSING" });
    const provided = String(req.headers["x-media-admin-key"] || "").trim();
    if (!provided) throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });
    if (!timingSafeEqualString(provided, configured)) throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
  }

  const adminSetMerchantPlanParamsSchema = Joi.object({
    merchantId: Joi.string().trim().min(1).max(80).required()
  });

  const adminSetMerchantPlanBodySchema = Joi.object({
    planKey: Joi.string().trim().valid("basic", "pro", "business").required()
  }).required();

  router.post(
    "/public/admin/merchants/:merchantId/plan",
    validate(adminSetMerchantPlanParamsSchema, "params"),
    validate(adminSetMerchantPlanBodySchema, "body"),
    async (req, res, next) => {
      try {
        requireMediaAdminKey(req);

        const merchantId = String(req.params.merchantId);
        const planKey = String(req.body.planKey);

        const merchant = await Merchant.findOne({ merchantId }).select("+accessToken +refreshToken");
        if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });

        merchant.planKey = planKey;
        merchant.planUpdatedAt = new Date();
        await merchant.save();

        return res.json({
          ok: true,
          merchant: {
            merchantId: merchant.merchantId,
            planKey: merchant.planKey,
            planUpdatedAt: merchant.planUpdatedAt ? new Date(merchant.planUpdatedAt).toISOString() : null,
            appStatus: merchant.appStatus
          }
        });
      } catch (err) {
        return next(err);
      }
    }
  );

  router.delete("/public/media/assets/:id", validate(mediaDeleteParamsSchema, "params"), async (req, res, next) => {
    try {
      requireMediaAdminKey(req);
      const { cloudName, apiKey, apiSecret } = requireCloudinaryConfig();
      const id = String(req.params.id);

      const asset = await MediaAsset.findOne({ _id: id, deletedAt: null });
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const timestamp = Math.floor(Date.now() / 1000);
      const signature = cloudinarySign({ public_id: String(asset.publicId), timestamp }, apiSecret);

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/${String(asset.resourceType)}/destroy`;
      const body = new URLSearchParams();
      body.set("public_id", String(asset.publicId));
      body.set("api_key", apiKey);
      body.set("timestamp", String(timestamp));
      body.set("signature", signature);

      await axios.post(url, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000
      });

      asset.deletedAt = new Date();
      await asset.save();

      for (const key of publicCache.keys()) {
        if (String(key || "").startsWith("public:media:")) publicCache.delete(key);
      }

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/public/media/assets/:id/break-link", validate(mediaDeleteParamsSchema, "params"), async (req, res, next) => {
    try {
      requireMediaAdminKey(req);
      const { cloudName, apiKey, apiSecret } = requireCloudinaryConfig();
      const id = String(req.params.id);

      const asset = await MediaAsset.findOne({ _id: id, deletedAt: null });
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const fromPublicId = String(asset.publicId || "").trim();
      if (!fromPublicId) throw new ApiError(409, "Invalid media asset", { code: "INVALID_MEDIA_ASSET" });

      const baseDir = fromPublicId.includes("/") ? fromPublicId.split("/").slice(0, -1).join("/") : "";
      const newLeaf = sha256Hex(`${fromPublicId}:${Date.now()}:${Math.random()}`).slice(0, 18);
      const toPublicId = baseDir ? `${baseDir}/${newLeaf}` : newLeaf;

      const timestamp = Math.floor(Date.now() / 1000);
      const signature = cloudinarySign({ from_public_id: fromPublicId, timestamp, to_public_id: toPublicId }, apiSecret);

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/${String(asset.resourceType)}/rename`;
      const body = new URLSearchParams();
      body.set("from_public_id", fromPublicId);
      body.set("to_public_id", toPublicId);
      body.set("api_key", apiKey);
      body.set("timestamp", String(timestamp));
      body.set("signature", signature);

      const resp = await axios.post(url, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000
      });

      const nextPublicId = String(resp?.data?.public_id || toPublicId).trim() || toPublicId;
      asset.publicId = nextPublicId;
      asset.assetId = resp?.data?.asset_id ? String(resp.data.asset_id) : asset.assetId;
      asset.url = resp?.data?.url ? String(resp.data.url) : asset.url;
      asset.secureUrl = resp?.data?.secure_url ? String(resp.data.secure_url) : asset.secureUrl;
      asset.thumbnailUrl = resp?.data?.secure_url ? String(resp.data.secure_url) : asset.thumbnailUrl;
      asset.cloudinaryCreatedAt = resp?.data?.created_at ? new Date(resp.data.created_at) : asset.cloudinaryCreatedAt;
      await asset.save();

      for (const key of publicCache.keys()) {
        if (String(key || "").startsWith("public:media:")) publicCache.delete(key);
      }

      return res.json({ ok: true, id: String(asset._id), publicId: asset.publicId });
    } catch (err) {
      return next(err);
    }
  });

  const publicMediaStoresQuerySchema = Joi.object({
    q: Joi.string().trim().max(80).allow("").default(""),
    sort: Joi.string()
      .trim()
      .valid("lastAt_desc", "lastAt_asc", "firstAt_desc", "firstAt_asc", "total_desc", "total_asc")
      .default("lastAt_desc"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(80).default(24)
  }).unknown(true);

  router.get("/public/media/stores", async (req, res, next) => {
    try {
      const { error, value } = publicMediaStoresQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const q = String(value.q || "").trim();
      const sort = String(value.sort || "lastAt_desc").trim();
      const page = Number(value.page);
      const limit = Number(value.limit);
      const skip = (page - 1) * limit;

      const cacheKey = `public:media:stores:${JSON.stringify({ q, sort, page, limit })}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        res.setHeader("Cache-Control", "public, max-age=5");
        return res.json(cached);
      }

      const match = { deletedAt: null };
      if (q) {
        const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        match.storeId = new RegExp(safe, "i");
      }

      const sortStage =
        sort === "lastAt_asc"
          ? { lastAt: 1, _id: 1 }
          : sort === "firstAt_desc"
            ? { firstAt: -1, _id: 1 }
            : sort === "firstAt_asc"
              ? { firstAt: 1, _id: 1 }
              : sort === "total_desc"
                ? { total: -1, lastAt: -1, _id: 1 }
                : sort === "total_asc"
                  ? { total: 1, lastAt: -1, _id: 1 }
                  : { lastAt: -1, _id: 1 };

      const pipeline = [
        { $match: match },
        { $addFields: { at: { $ifNull: ["$cloudinaryCreatedAt", "$createdAt"] } } },
        {
          $group: {
            _id: "$storeId",
            total: { $sum: 1 },
            images: { $sum: { $cond: [{ $eq: ["$resourceType", "image"] }, 1, 0] } },
            videos: { $sum: { $cond: [{ $eq: ["$resourceType", "video"] }, 1, 0] } },
            raws: { $sum: { $cond: [{ $eq: ["$resourceType", "raw"] }, 1, 0] } },
            firstAt: { $min: "$at" },
            lastAt: { $max: "$at" }
          }
        },
        { $sort: sortStage },
        {
          $facet: {
            meta: [{ $count: "total" }],
            items: [{ $skip: skip }, { $limit: limit }]
          }
        }
      ];

      const agg = await MediaAsset.aggregate(pipeline, { allowDiskUse: true });
      const root = Array.isArray(agg) && agg.length ? agg[0] : null;
      const total = Number(root?.meta?.[0]?.total || 0) || 0;
      const items = Array.isArray(root?.items) ? root.items : [];

      const storeIds = items.map((it) => String(it?._id || "")).filter(Boolean);
      const storeInfoById = new Map();
      await Promise.all(
        storeIds.map(async (sid) => {
          const info = await getPublicStoreInfo(sid);
          storeInfoById.set(String(sid), info);
        })
      );

      const payload = {
        ok: true,
        sort,
        page,
        limit,
        total,
        stores: items.map((it) => ({
          storeId: String(it._id),
          store: storeInfoById.get(String(it._id)) || null,
          total: Number(it.total || 0) || 0,
          images: Number(it.images || 0) || 0,
          videos: Number(it.videos || 0) || 0,
          raws: Number(it.raws || 0) || 0,
          firstAt: it.firstAt ? new Date(it.firstAt).toISOString() : null,
          lastAt: it.lastAt ? new Date(it.lastAt).toISOString() : null
        }))
      };

      cacheSet(cacheKey, payload, 5_000);
      res.setHeader("Cache-Control", "public, max-age=5");
      return res.json(payload);
    } catch (err) {
      return next(err);
    }
  });

  const publicMediaOverviewQuerySchema = Joi.object({
    top: Joi.number().integer().min(1).max(12).default(6),
    latestLimit: Joi.number().integer().min(1).max(30).default(10)
  }).unknown(true);

  router.get("/public/media/overview", async (req, res, next) => {
    try {
      const { error, value } = publicMediaOverviewQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const top = Number(value.top);
      const latestLimit = Number(value.latestLimit);

      const cacheKey = `public:media:overview:${JSON.stringify({ top, latestLimit })}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        res.setHeader("Cache-Control", "public, max-age=4");
        return res.json(cached);
      }

      const match = { deletedAt: null };
      const groupPipeline = [
        { $match: match },
        { $addFields: { at: { $ifNull: ["$cloudinaryCreatedAt", "$createdAt"] } } },
        {
          $group: {
            _id: "$storeId",
            total: { $sum: 1 },
            images: { $sum: { $cond: [{ $eq: ["$resourceType", "image"] }, 1, 0] } },
            videos: { $sum: { $cond: [{ $eq: ["$resourceType", "video"] }, 1, 0] } },
            raws: { $sum: { $cond: [{ $eq: ["$resourceType", "raw"] }, 1, 0] } },
            firstAt: { $min: "$at" },
            lastAt: { $max: "$at" }
          }
        }
      ];

      const totalsPipeline = [
        { $match: match },
        { $addFields: { at: { $ifNull: ["$cloudinaryCreatedAt", "$createdAt"] } } },
        {
          $group: {
            _id: null,
            totalAssets: { $sum: 1 },
            images: { $sum: { $cond: [{ $eq: ["$resourceType", "image"] }, 1, 0] } },
            videos: { $sum: { $cond: [{ $eq: ["$resourceType", "video"] }, 1, 0] } },
            raws: { $sum: { $cond: [{ $eq: ["$resourceType", "raw"] }, 1, 0] } },
            firstAt: { $min: "$at" },
            lastAt: { $max: "$at" }
          }
        }
      ];

      const [totalsAgg, totalStoresAgg, newestAgg, oldestAgg, biggestAgg, stalestAgg, latestDocs] = await Promise.all([
        MediaAsset.aggregate(totalsPipeline, { allowDiskUse: true }),
        MediaAsset.aggregate([...groupPipeline, { $count: "total" }], { allowDiskUse: true }),
        MediaAsset.aggregate([...groupPipeline, { $sort: { lastAt: -1, _id: 1 } }, { $limit: top }], { allowDiskUse: true }),
        MediaAsset.aggregate([...groupPipeline, { $sort: { firstAt: 1, _id: 1 } }, { $limit: top }], { allowDiskUse: true }),
        MediaAsset.aggregate([...groupPipeline, { $sort: { total: -1, lastAt: -1, _id: 1 } }, { $limit: top }], { allowDiskUse: true }),
        MediaAsset.aggregate([...groupPipeline, { $sort: { lastAt: 1, _id: 1 } }, { $limit: top }], { allowDiskUse: true }),
        MediaAsset.find(match).sort({ cloudinaryCreatedAt: -1, createdAt: -1, _id: 1 }).limit(latestLimit)
      ]);

      const totalsRoot = Array.isArray(totalsAgg) && totalsAgg.length ? totalsAgg[0] : null;
      const totalStores = Number(totalStoresAgg?.[0]?.total || 0) || 0;

      const allIds = new Set([
        ...[...newestAgg, ...oldestAgg, ...biggestAgg, ...stalestAgg].map((it) => String(it?._id || "")).filter(Boolean),
        ...(Array.isArray(latestDocs) ? latestDocs : []).map((d) => String(d?.storeId || "")).filter(Boolean)
      ]);

      const storeInfoById = new Map();
      await Promise.all(
        Array.from(allIds).map(async (sid) => {
          const info = await getPublicStoreInfo(sid);
          storeInfoById.set(String(sid), info);
        })
      );

      function mapStoreRow(it) {
        return {
          storeId: String(it._id),
          store: storeInfoById.get(String(it._id)) || null,
          total: Number(it.total || 0) || 0,
          images: Number(it.images || 0) || 0,
          videos: Number(it.videos || 0) || 0,
          raws: Number(it.raws || 0) || 0,
          firstAt: it.firstAt ? new Date(it.firstAt).toISOString() : null,
          lastAt: it.lastAt ? new Date(it.lastAt).toISOString() : null
        };
      }

      const payload = {
        ok: true,
        generatedAt: new Date().toISOString(),
        stats: {
          totalStores,
          totalAssets: Number(totalsRoot?.totalAssets || 0) || 0,
          images: Number(totalsRoot?.images || 0) || 0,
          videos: Number(totalsRoot?.videos || 0) || 0,
          raws: Number(totalsRoot?.raws || 0) || 0,
          firstAt: totalsRoot?.firstAt ? new Date(totalsRoot.firstAt).toISOString() : null,
          lastAt: totalsRoot?.lastAt ? new Date(totalsRoot.lastAt).toISOString() : null
        },
        highlights: {
          lastUploader: newestAgg && newestAgg.length ? mapStoreRow(newestAgg[0]) : null,
          stalest: stalestAgg && stalestAgg.length ? mapStoreRow(stalestAgg[0]) : null
        },
        latestAssets: (Array.isArray(latestDocs) ? latestDocs : []).map((doc) => {
          const at = doc?.cloudinaryCreatedAt || doc?.createdAt || null;
          const storeId = String(doc?.storeId || "");
          return {
            id: String(doc?._id),
            storeId,
            store: storeInfoById.get(storeId) || null,
            resourceType: doc?.resourceType || null,
            publicId: doc?.publicId || null,
            originalFilename: doc?.originalFilename || null,
            url: doc?.url || null,
            secureUrl: doc?.secureUrl || null,
            at: at ? new Date(at).toISOString() : null
          };
        }),
        lists: {
          newest: Array.isArray(newestAgg) ? newestAgg.map(mapStoreRow) : [],
          oldest: Array.isArray(oldestAgg) ? oldestAgg.map(mapStoreRow) : [],
          biggest: Array.isArray(biggestAgg) ? biggestAgg.map(mapStoreRow) : [],
          stalest: Array.isArray(stalestAgg) ? stalestAgg.map(mapStoreRow) : []
        }
      };

      cacheSet(cacheKey, payload, 4_000);
      res.setHeader("Cache-Control", "public, max-age=4");
      return res.json(payload);
    } catch (err) {
      return next(err);
    }
  });

  const publicMediaStoreParamsSchema = Joi.object({
    storeId: Joi.string().trim().min(1).max(80).required()
  });

  const publicMediaAssetsQuerySchema = Joi.object({
    resourceType: Joi.string().trim().valid("image", "video", "raw", "").allow("").default(""),
    q: Joi.string().trim().max(120).allow("").default(""),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(60).default(24)
  }).unknown(true);

  router.get("/public/media/stores/:storeId/assets", validate(publicMediaStoreParamsSchema, "params"), async (req, res, next) => {
    try {
      const { error, value } = publicMediaAssetsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const storeId = String(req.params.storeId);
      const page = Number(value.page);
      const limit = Number(value.limit);
      const skip = (page - 1) * limit;

      const q = String(value.q || "").trim();
      const resourceType = String(value.resourceType || "").trim();

      const cacheKey = `public:media:assets:${JSON.stringify({ storeId, q, resourceType, page, limit })}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        res.setHeader("Cache-Control", "public, max-age=3");
        return res.json(cached);
      }

      const baseStoreFilter = { storeId, deletedAt: null };
      const filter = { ...baseStoreFilter };
      if (resourceType) filter.resourceType = resourceType;
      if (q) {
        const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(safe, "i");
        filter.$or = [{ publicId: re }, { originalFilename: re }];
      }

      const summaryPipeline = [
        { $match: baseStoreFilter },
        {
          $group: {
            _id: "$storeId",
            total: { $sum: 1 },
            images: { $sum: { $cond: [{ $eq: ["$resourceType", "image"] }, 1, 0] } },
            videos: { $sum: { $cond: [{ $eq: ["$resourceType", "video"] }, 1, 0] } },
            raws: { $sum: { $cond: [{ $eq: ["$resourceType", "raw"] }, 1, 0] } },
            lastCloudinaryCreatedAt: { $max: "$cloudinaryCreatedAt" },
            lastCreatedAt: { $max: "$createdAt" }
          }
        },
        { $addFields: { lastAt: { $ifNull: ["$lastCloudinaryCreatedAt", "$lastCreatedAt"] } } }
      ];

      const [storeInfo, summaryAgg, total, docs] = await Promise.all([
        getPublicStoreInfo(storeId),
        MediaAsset.aggregate(summaryPipeline, { allowDiskUse: true }),
        MediaAsset.countDocuments(filter),
        MediaAsset.find(filter).sort({ cloudinaryCreatedAt: -1, createdAt: -1 }).skip(skip).limit(limit)
      ]);

      const summaryRoot = Array.isArray(summaryAgg) && summaryAgg.length ? summaryAgg[0] : null;
      const summary = summaryRoot
        ? {
            total: Number(summaryRoot.total || 0) || 0,
            images: Number(summaryRoot.images || 0) || 0,
            videos: Number(summaryRoot.videos || 0) || 0,
            raws: Number(summaryRoot.raws || 0) || 0,
            lastAt: summaryRoot.lastAt ? new Date(summaryRoot.lastAt).toISOString() : null
          }
        : { total: 0, images: 0, videos: 0, raws: 0, lastAt: null };

      const payload = {
        ok: true,
        storeId,
        store: storeInfo || null,
        summary,
        page,
        limit,
        total: Number(total || 0) || 0,
        items: docs.map(serializeMediaAsset)
      };

      cacheSet(cacheKey, payload, 3_000);
      res.setHeader("Cache-Control", "public, max-age=3");
      return res.json(payload);
    } catch (err) {
      return next(err);
    }
  });

  const proxyMediaAssetsQuerySchema = Joi.object({
    merchantId: Joi.string().trim().min(1).max(80).required(),
    resourceType: Joi.string().trim().valid("image", "video", "raw"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(60).default(24),
    token: Joi.string().trim().min(10),
    signature: Joi.string().trim().min(8),
    hmac: Joi.string().trim().min(8)
  })
    .or("signature", "hmac", "token")
    .unknown(true);

  router.get("/proxy/media/assets", async (req, res, next) => {
    try {
      const { error, value } = proxyMediaAssetsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: false });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      ensureValidProxyAuth(value, value.merchantId);

      const merchant = await findMerchantByMerchantId(String(value.merchantId));
      if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });
      if (merchant.appStatus !== "installed") throw new ApiError(403, "Merchant is not active", { code: "MERCHANT_INACTIVE" });

      const storeId = String(value.merchantId);
      const filter = { storeId, deletedAt: null };
      if (value.resourceType) filter.resourceType = String(value.resourceType);

      const page = Number(value.page);
      const limit = Number(value.limit);
      const skip = (page - 1) * limit;

      const [total, docs] = await Promise.all([
        MediaAsset.countDocuments(filter),
        MediaAsset.find(filter).sort({ cloudinaryCreatedAt: -1, createdAt: -1 }).skip(skip).limit(limit)
      ]);

      return res.json({
        ok: true,
        merchantId: storeId,
        page,
        limit,
        total,
        items: docs.map(serializeMediaAsset)
      });
    } catch (err) {
      return next(err);
    }
  });

  const proxyMediaSignatureQuerySchema = Joi.object({
    merchantId: Joi.string().trim().min(1).max(80).required(),
    token: Joi.string().trim().min(10),
    signature: Joi.string().trim().min(8),
    hmac: Joi.string().trim().min(8)
  })
    .or("signature", "hmac", "token")
    .unknown(true);

  router.post("/proxy/media/signature", async (req, res, next) => {
    try {
      const { error: qErr, value: qValue } = proxyMediaSignatureQuerySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: false
      });
      if (qErr) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: qErr.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const { error: bErr, value: bValue } = mediaSignatureBodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (bErr) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: bErr.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      ensureValidProxyAuth(qValue, qValue.merchantId);

      const merchant = await findMerchantByMerchantId(String(qValue.merchantId));
      if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });
      if (merchant.appStatus !== "installed") throw new ApiError(403, "Merchant is not active", { code: "MERCHANT_INACTIVE" });

      const { cloudName, apiKey, apiSecret, folderPrefix } = requireCloudinaryConfig();
      const merchantId = String(qValue.merchantId);
      const folder = mediaFolderForMerchant(folderPrefix, merchantId);
      const timestamp = Math.floor(Date.now() / 1000);

      const policy = await validateUploadPolicyOrThrow({ merchant, file: bValue.file, resourceTypeHint: bValue.resourceType });
      const leaf = randomLeaf(policy.limits.linkLeafLength);
      const publicId = leaf;

      const context = bValue.context && typeof bValue.context === "object" ? bValue.context : {};
      const contextParts = [];
      for (const [k, v] of Object.entries(context)) {
        const key = String(k || "").trim();
        if (!key) continue;
        const val = String(v == null ? "" : v).trim();
        if (!val) continue;
        contextParts.push(`${key}=${val}`);
      }
      const contextStr = contextParts.length ? contextParts.join("|") : null;

      const tags = Array.isArray(bValue.tags) ? bValue.tags.map((t) => String(t).trim()).filter(Boolean) : [];
      const tagsStr = tags.length ? tags.join(",") : null;

      const paramsToSign = {
        folder,
        timestamp,
        public_id: publicId,
        ...(contextStr ? { context: contextStr } : {}),
        ...(tagsStr ? { tags: tagsStr } : {})
      };
      const signature = cloudinarySign(paramsToSign, apiSecret);

      return res.json({
        ok: true,
        cloudinary: {
          cloudName,
          apiKey,
          resourceType: policy.resourceType,
          uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${policy.resourceType}/upload`,
          folder,
          publicId,
          timestamp,
          signature,
          ...(contextStr ? { context: contextStr } : {}),
          ...(tagsStr ? { tags: tagsStr } : {})
        }
      });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/proxy/media/assets", async (req, res, next) => {
    try {
      const { error: qErr, value: qValue } = proxyMediaSignatureQuerySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: false
      });
      if (qErr) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: qErr.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const { error: bErr, value: bValue } = mediaRecordBodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (bErr) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: bErr.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      ensureValidProxyAuth(qValue, qValue.merchantId);

      const merchant = await findMerchantByMerchantId(String(qValue.merchantId));
      if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });
      if (merchant.appStatus !== "installed") throw new ApiError(403, "Merchant is not active", { code: "MERCHANT_INACTIVE" });

      const merchantId = String(qValue.merchantId);
      const storeId = merchantId;
      const c = bValue.cloudinary || {};

      const planKey = getPlanKey(merchant);
      const limits = getPlanLimits(planKey);
      const allowed = getAllowedExtForPlan(planKey);
      let fileExt = normalizeFilenameExt(c.original_filename);
      if (!fileExt) {
        const fmt = String(c.format || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
        if (fmt) fileExt = fmt;
      }
      if (fileExt && bannedExt.has(fileExt)) {
        await cloudinaryDestroyByPublicId({ resourceType: String(c.resource_type), publicId: String(c.public_id) }).catch(() => undefined);
        throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
      }
      if (allowed && fileExt && !allowed.has(fileExt)) {
        await cloudinaryDestroyByPublicId({ resourceType: String(c.resource_type), publicId: String(c.public_id) }).catch(() => undefined);
        throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
      }
      if ((planKey !== "pro" && planKey !== "business") && String(c.format || "").toLowerCase() === "svg") {
        await cloudinaryDestroyByPublicId({ resourceType: String(c.resource_type), publicId: String(c.public_id) }).catch(() => undefined);
        throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
      }

      const prev = await MediaAsset.findOne({ storeId, publicId: String(c.public_id), deletedAt: null }).lean();
      const used = await getStoreUsedBytesCached(storeId);
      const prevBytes = Number(prev?.bytes || 0) || 0;
      const nextBytes = Number(c.bytes || 0) || 0;
      if (nextBytes > limits.maxFileBytes) {
        await cloudinaryDestroyByPublicId({ resourceType: String(c.resource_type), publicId: String(c.public_id) }).catch(() => undefined);
        throw new ApiError(403, "File size limit exceeded", { code: "FILE_SIZE_LIMIT_EXCEEDED" });
      }
      if (used - prevBytes + nextBytes > limits.maxStorageBytes) {
        await cloudinaryDestroyByPublicId({ resourceType: String(c.resource_type), publicId: String(c.public_id) }).catch(() => undefined);
        throw new ApiError(403, "Storage limit exceeded", { code: "STORAGE_LIMIT_EXCEEDED" });
      }

      const expectedPrefix = `${String(config?.cloudinary?.folderPrefix || "bundle_app").trim().replace(/\/+$/g, "")}/${storeId}/`;
      if (!String(c.public_id || "").startsWith(expectedPrefix)) {
        await cloudinaryDestroyByPublicId({ resourceType: String(c.resource_type), publicId: String(c.public_id) }).catch(() => undefined);
        throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
      }

      if (String(c.format || "").toLowerCase() === "svg") {
        const urlToCheck = String(c.secure_url || c.url || "").trim();
        try {
          await ensureSvgSafeOrThrow(urlToCheck);
        } catch (e) {
          await cloudinaryDestroyByPublicId({ resourceType: String(c.resource_type), publicId: String(c.public_id) }).catch(() => undefined);
          throw e;
        }
      }

      const createdAt = c.created_at ? new Date(String(c.created_at)) : null;
      const cloudinaryCreatedAt = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null;

      const contextObj = c.context && typeof c.context === "object" ? c.context : null;
      const ctx = contextObj && typeof contextObj.custom === "object" ? contextObj.custom : contextObj;

      const doc = await MediaAsset.findOneAndUpdate(
        { storeId, publicId: String(c.public_id), deletedAt: null },
        {
          $set: {
            merchantId,
            storeId,
            resourceType: String(c.resource_type),
            publicId: String(c.public_id),
            assetId: c.asset_id ? String(c.asset_id) : null,
            folder: c.folder ? String(c.folder) : null,
            originalFilename: c.original_filename ? String(c.original_filename) : null,
            format: c.format ? String(c.format) : null,
            bytes: c.bytes != null ? Number(c.bytes) : null,
            width: c.width != null ? Number(c.width) : null,
            height: c.height != null ? Number(c.height) : null,
            duration: c.duration != null ? Number(c.duration) : null,
            url: c.url ? String(c.url) : null,
            secureUrl: c.secure_url ? String(c.secure_url) : null,
            thumbnailUrl: c.secure_url ? String(c.secure_url) : null,
            tags: Array.isArray(c.tags) ? c.tags.map((t) => String(t)).filter(Boolean) : [],
            context: ctx || null,
            cloudinaryCreatedAt,
            cloudinary: c
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json({ ok: true, asset: serializeMediaAsset(doc) });
    } catch (err) {
      return next(err);
    }
  });

  const proxyProductVariantsQuerySchema = Joi.object({
    merchantId: Joi.string().trim().min(1).max(80).required(),
    productId: Joi.string().trim().min(1).max(120).required(),
    token: Joi.string().trim().min(10),
    signature: Joi.string().trim().min(8),
    hmac: Joi.string().trim().min(8)
  })
    .or("signature", "hmac", "token")
    .unknown(true);

  function extractVariantIdsFromProductPayload(data) {
    const roots = [];
    if (data && typeof data === "object") roots.push(data);
    if (data?.data && typeof data.data === "object") roots.push(data.data);

    const candidates = [];
    for (const root of roots) {
      const variantLike = root?.variants ?? root?.product_variants ?? null;
      if (variantLike) {
        if (Array.isArray(variantLike)) candidates.push(...variantLike);
        else if (Array.isArray(variantLike?.data)) candidates.push(...variantLike.data);
        else if (Array.isArray(variantLike?.items)) candidates.push(...variantLike.items);
        else if (Array.isArray(variantLike?.list)) candidates.push(...variantLike.list);
      }

      const skus = root?.skus ?? null;
      if (skus) {
        if (Array.isArray(skus)) candidates.push(...skus);
        else if (Array.isArray(skus?.data)) candidates.push(...skus.data);
        else if (Array.isArray(skus?.items)) candidates.push(...skus.items);
        else if (Array.isArray(skus?.list)) candidates.push(...skus.list);
      }

      const options = root?.options ?? null;
      const optionArr = Array.isArray(options)
        ? options
        : Array.isArray(options?.data)
          ? options.data
          : Array.isArray(options?.items)
            ? options.items
            : Array.isArray(options?.list)
              ? options.list
              : [];

      for (const opt of optionArr) {
        const optSkus = opt?.skus ?? null;
        if (!optSkus) continue;
        const skuArr = Array.isArray(optSkus)
          ? optSkus
          : Array.isArray(optSkus?.data)
            ? optSkus.data
            : Array.isArray(optSkus?.items)
              ? optSkus.items
              : Array.isArray(optSkus?.list)
                ? optSkus.list
                : [];
        candidates.push(...skuArr);
      }
    }

    const ids = [];
    for (const it of candidates) {
      if (it == null) continue;
      const id = it?.id ?? it?.sku_id ?? it?.variant_id ?? it?.variantId ?? it?.variantID ?? null;
      const s = String(id ?? "").trim();
      if (s) ids.push(s);
    }
    const uniq = Array.from(new Set(ids));
    if (uniq.length) return uniq;

    const fallback = [];
    for (const root of roots) {
      const direct =
        root?.default_variant_id ??
        root?.defaultVariantId ??
        root?.variant_id ??
        root?.variantId ??
        root?.default_sku_id ??
        root?.defaultSkuId ??
        root?.sku_id ??
        root?.skuId ??
        (root?.default_sku && typeof root.default_sku === "object" ? root.default_sku.id ?? root.default_sku.sku_id ?? null : null) ??
        (root?.sku && typeof root.sku === "object" ? root.sku.id ?? root.sku.sku_id ?? null : null) ??
        (root?.data && typeof root.data === "object"
          ? root.data.default_variant_id ??
          root.data.defaultVariantId ??
          root.data.variant_id ??
          root.data.variantId ??
          root.data.default_sku_id ??
          root.data.defaultSkuId ??
          root.data.sku_id ??
          root.data.skuId ??
          (root.data.default_sku && typeof root.data.default_sku === "object"
            ? root.data.default_sku.id ?? root.data.default_sku.sku_id ?? null
            : null) ??
          (root.data.sku && typeof root.data.sku === "object" ? root.data.sku.id ?? root.data.sku.sku_id ?? null : null)
          : null);
      const s = String(direct ?? "").trim();
      if (s) fallback.push(s);
    }
    return Array.from(new Set(fallback));
  }

  function normalizeMaybeArray(input) {
    if (Array.isArray(input)) return input;
    if (Array.isArray(input?.data)) return input.data;
    if (Array.isArray(input?.items)) return input.items;
    if (Array.isArray(input?.list)) return input.list;
    return [];
  }

  function extractOptionIdByValueIdFromProductPayload(data) {
    const roots = [];
    if (data && typeof data === "object") roots.push(data);
    if (data?.data && typeof data.data === "object") roots.push(data.data);

    const map = new Map();
    for (const root of roots) {
      const options = normalizeMaybeArray(root?.options ?? null);
      for (const opt of options) {
        const optId = String(opt?.id ?? opt?.option_id ?? opt?.optionId ?? "").trim();
        if (!optId) continue;
        const values = normalizeMaybeArray(opt?.values ?? opt?.option_values ?? opt?.optionValues ?? null);
        for (const val of values) {
          const valId = String(val?.id ?? val?.value_id ?? val?.valueId ?? "").trim();
          if (!valId) continue;
          map.set(valId, optId);
        }
      }
    }
    return map;
  }

  function extractOptionValueLabelByValueIdFromProductPayload(data) {
    const roots = [];
    if (data && typeof data === "object") roots.push(data);
    if (data?.data && typeof data.data === "object") roots.push(data.data);

    const map = new Map();
    for (const root of roots) {
      const options = normalizeMaybeArray(root?.options ?? null);
      for (const opt of options) {
        const optId = String(opt?.id ?? opt?.option_id ?? opt?.optionId ?? "").trim();
        if (!optId) continue;
        const optName = String(opt?.name ?? opt?.title ?? opt?.label ?? "").trim();
        const values = normalizeMaybeArray(opt?.values ?? opt?.option_values ?? opt?.optionValues ?? null);
        for (const val of values) {
          const valId = String(val?.id ?? val?.value_id ?? val?.valueId ?? "").trim();
          if (!valId) continue;
          const valName = String(val?.name ?? val?.value ?? val?.label ?? val?.title ?? "").trim();
          map.set(valId, { optionId: optId, optionName: optName || null, valueName: valName || null });
        }
      }
    }
    return map;
  }

  function extractSkuRecordsFromProductPayload(data) {
    const roots = [];
    if (data && typeof data === "object") roots.push(data);
    if (data?.data && typeof data.data === "object") roots.push(data.data);

    const candidates = [];
    for (const root of roots) {
      candidates.push(...normalizeMaybeArray(root?.skus ?? null));
      const options = normalizeMaybeArray(root?.options ?? null);
      for (const opt of options) {
        candidates.push(...normalizeMaybeArray(opt?.skus ?? null));
      }
    }
    return candidates;
  }

  function extractCartOptionsByVariantIdFromProductPayload(productResp) {
    const optionIdByValueId = extractOptionIdByValueIdFromProductPayload(productResp);
    const candidates = extractSkuRecordsFromProductPayload(productResp);
    const out = new Map();

    for (const sku of candidates) {
      if (sku == null) continue;
      const skuId = sku?.id ?? sku?.sku_id ?? sku?.variant_id ?? sku?.variantId ?? sku?.variantID ?? null;
      const skuIdStr = String(skuId ?? "").trim();
      if (!skuIdStr) continue;

      const relatedRaw =
        sku?.related_option_values ??
        sku?.relatedOptionValues ??
        sku?.option_values ??
        sku?.optionValues ??
        sku?.values ??
        [];
      const related = normalizeMaybeArray(relatedRaw);
      const options = {};
      for (const val of related) {
        const valIdStr = String(val ?? "").trim();
        if (!valIdStr) continue;
        const optId = optionIdByValueId.get(valIdStr);
        if (!optId) continue;
        options[optId] = valIdStr;
      }
      out.set(skuIdStr, Object.keys(options).length ? options : null);
    }
    return out;
  }

  router.get("/proxy/products/variants", async (req, res, next) => {
    try {
      const { error, value } = proxyProductVariantsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: false });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      ensureValidProxyAuth(value, value.merchantId);

      const merchant = await findMerchantByMerchantId(String(value.merchantId));
      if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });
      if (merchant.appStatus !== "installed") throw new ApiError(403, "Merchant is not active", { code: "MERCHANT_INACTIVE" });

      await ensureMerchantTokenFresh(merchant);

      const productId = String(value.productId || "").trim();
      const productResp = await getProductById(config.salla, merchant.accessToken, productId, {});
      const cartOptionsByVariantId = extractCartOptionsByVariantIdFromProductPayload(productResp);
      const optionValueLabelByValueId = extractOptionValueLabelByValueIdFromProductPayload(productResp);
      const variantIds = extractVariantIdsFromProductPayload(productResp);
      const report = variantIds.length
        ? await fetchVariantsSnapshotReport(config.salla, merchant.accessToken, variantIds, { concurrency: 6, maxAttempts: 3 })
        : { snapshots: new Map(), missing: [] };

      const variants = Array.from(report.snapshots.values())
        .filter((s) => String(s?.productId || "").trim() === productId)
        .map((s) => {
          const variantId = String(s.variantId);
          const cartOptions = cartOptionsByVariantId.get(String(variantId)) || null;
          const resolvedAttrs = {};
          if (cartOptions && typeof cartOptions === "object") {
            for (const [optId, valId] of Object.entries(cartOptions)) {
              const meta = optionValueLabelByValueId.get(String(valId)) || null;
              const key = String(meta?.optionName || optId).trim();
              const val = String(meta?.valueName || valId).trim();
              if (key && val) resolvedAttrs[key] = val;
            }
          }
          const snapAttrs = s.attributes && typeof s.attributes === "object" ? s.attributes : {};
          const attrs = Object.keys(resolvedAttrs).length ? resolvedAttrs : snapAttrs;
          return {
            variantId,
            productId: String(s.productId),
            name: s.name || null,
            attributes: attrs,
            imageUrl: s.imageUrl || null,
            price: s.price != null ? Number(s.price) : null,
            cartProductId: productId,
            cartOptions,
            isActive: s.isActive === true
          };
        })
        .sort((a, b) => Number(Boolean(b.isActive)) - Number(Boolean(a.isActive)));

      return res.json({
        ok: true,
        merchantId: String(value.merchantId),
        productId,
        variants,
        validation: {
          missing: report.missing || []
        }
      });
    } catch (err) {
      return next(err);
    }
  });

  const sallaProductsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    per_page: Joi.number().integer().min(1).max(200),
    perPage: Joi.number().integer().min(1).max(200),
    format: Joi.string().trim().min(1).max(50),
    search: Joi.string().allow("").max(200),
    keyword: Joi.string().allow("").max(200),
    status: Joi.string().trim().min(1).max(50),
    category: Joi.number().integer().min(1)
  });

  router.get("/products", merchantAuth(config), validate(sallaProductsQuerySchema, "query"), async (req, res, next) => {
    const page = req.query.page;
    const perPage = req.query.per_page ?? req.query.perPage;
    const format = req.query.format;
    const search = String(req.query.keyword ?? req.query.search ?? "").trim() || undefined;
    const status = req.query.status;
    const category = req.query.category;

    try {
      const response = await listProducts(config.salla, req.merchantAccessToken, { page, perPage, format, search, status, category });
      return res.json(response);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401 && req.merchant) {
        try {
          await refreshAccessToken(config.salla, req.merchant);
          req.merchantAccessToken = req.merchant.accessToken;
          const response = await listProducts(config.salla, req.merchantAccessToken, { page, perPage, format, search, status, category });
          return res.json(response);
        } catch {
          return next(err);
        }
      }
      return next(err);
    }
  });

  const sallaProductParamsSchema = Joi.object({
    productId: Joi.string().trim().min(1).max(80).required()
  });

  const sallaProductDetailsQuerySchema = Joi.object({
    format: Joi.string().trim().min(1).max(50)
  });

  router.get(
    "/products/:productId",
    merchantAuth(config),
    validate(sallaProductParamsSchema, "params"),
    validate(sallaProductDetailsQuerySchema, "query"),
    async (req, res, next) => {
      const productId = req.params.productId;
      const format = req.query.format;
      try {
        const response = await getProductById(config.salla, req.merchantAccessToken, productId, { format });
        return res.json(response);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401 && req.merchant) {
          try {
            await refreshAccessToken(config.salla, req.merchant);
            req.merchantAccessToken = req.merchant.accessToken;
            const response = await getProductById(config.salla, req.merchantAccessToken, productId, { format });
            return res.json(response);
          } catch {
            return next(err);
          }
        }
        return next(err);
      }
    }
  );

  const sallaVariantParamsSchema = Joi.object({
    variantId: Joi.string().trim().min(1).max(120).required()
  });

  router.get(
    "/variants/:variantId",
    merchantAuth(config),
    validate(sallaVariantParamsSchema, "params"),
    async (req, res, next) => {
      const variantId = req.params.variantId;
      try {
        const response = await getProductVariant(config.salla, req.merchantAccessToken, variantId);
        return res.json(response);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401 && req.merchant) {
          try {
            await refreshAccessToken(config.salla, req.merchant);
            req.merchantAccessToken = req.merchant.accessToken;
            const response = await getProductVariant(config.salla, req.merchantAccessToken, variantId);
            return res.json(response);
          } catch {
            return next(err);
          }
        }
        return next(err);
      }
    }
  );

  const variantsSnapshotSchema = Joi.object({
    variantIds: Joi.array().items(Joi.string().trim().min(1).max(120)).min(1).max(200).required()
  });

  router.post(
    "/variants/snapshots",
    merchantAuth(config),
    validate(variantsSnapshotSchema, "body"),
    async (req, res, next) => {
      const variantIds = req.body.variantIds || [];
      try {
        const report = await fetchVariantsSnapshotReport(config.salla, req.merchantAccessToken, variantIds, { concurrency: 5, maxAttempts: 3 });
        return res.json({ variants: Array.from(report.snapshots.values()), missing: report.missing || [] });
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401 && req.merchant) {
          try {
            await refreshAccessToken(config.salla, req.merchant);
            req.merchantAccessToken = req.merchant.accessToken;
            const report = await fetchVariantsSnapshotReport(config.salla, req.merchantAccessToken, variantIds, { concurrency: 5, maxAttempts: 3 });
            return res.json({ variants: Array.from(report.snapshots.values()), missing: report.missing || [] });
          } catch {
            return next(err);
          }
        }
        return next(err);
      }
    }
  );

  return router;
}

module.exports = {
  createApiRouter
};
