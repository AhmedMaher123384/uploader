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
const sharp = require("sharp");
const zlib = require("zlib");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { spawn } = require("child_process");
const { readSnippetCss } = require("../storefront/snippet/styles");
const mountMediaPlatform = require("../storefront/snippet/features/mediaPlatform/media.mount");
const MediaAsset = require("../models/MediaAsset");
const Merchant = require("../models/Merchant");

function createApiRouter(config) {
  const router = express.Router();
  const publicCache = new Map();
  const mediaPolicyCache = new Map();
  let r2Client = null;

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

  const MEDIA_SESSION_COOKIE = "__bundleapp_msid";

  function parseCookies(header) {
    const h = String(header || "");
    if (!h) return {};
    const out = {};
    const parts = h.split(";");
    for (let i = 0; i < parts.length; i += 1) {
      const p = String(parts[i] || "");
      const eq = p.indexOf("=");
      if (eq <= 0) continue;
      const k = p.slice(0, eq).trim();
      if (!k) continue;
      const v = p.slice(eq + 1).trim();
      out[k] = v;
    }
    return out;
  }

  function issueMediaSessionToken({ storeId, userAgent }) {
    const secret = config?.salla?.clientSecret || config?.salla?.webhookSecret;
    if (!secret) throw new ApiError(500, "Proxy secret is not configured", { code: "PROXY_SECRET_MISSING" });
    const ua = String(userAgent || "");
    const uaHash = ua ? sha256Hex(ua).slice(0, 16) : "";
    const payload = JSON.stringify({
      storeId: String(storeId || "").trim(),
      uaHash,
      iat: Date.now(),
      nonce: sha256Hex(`${Date.now()}:${Math.random()}`).slice(0, 12)
    });
    const payloadB64 = base64UrlEncodeUtf8(payload);
    const sig = hmacSha256(secret, payloadB64, "hex");
    return `${payloadB64}.${sig}`;
  }

  function ensureValidMediaSessionToken(token, expectedStoreId, userAgent) {
    const secret = config?.salla?.clientSecret || config?.salla?.webhookSecret;
    if (!secret) throw new ApiError(500, "Proxy secret is not configured", { code: "PROXY_SECRET_MISSING" });

    const raw = String(token || "").trim();
    const [payloadB64, sig] = raw.split(".");
    if (!payloadB64 || !sig) throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });

    const computed = hmacSha256(secret, String(payloadB64), "hex");
    if (!timingSafeEqualString(String(sig), String(computed))) {
      throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });
    }

    let payload = null;
    try {
      payload = JSON.parse(base64UrlDecodeUtf8(payloadB64));
    } catch {
      throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });
    }

    const sid = String(payload?.storeId || "").trim();
    const iat = Number(payload?.iat || 0);
    if (!sid || !Number.isFinite(iat) || iat <= 0) throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });

    const expected = String(expectedStoreId || "").trim();
    if (!expected || sid !== expected) throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });

    const maxAgeMs = 12 * 60 * 60 * 1000;
    if (iat < Date.now() - maxAgeMs) throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });

    const ua = String(userAgent || "");
    const expectedUaHash = ua ? sha256Hex(ua).slice(0, 16) : "";
    const uaHash = String(payload?.uaHash || "");
    if (expectedUaHash && uaHash && uaHash !== expectedUaHash) throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });
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
      const acceptEnc = String(req.headers["accept-encoding"] || "");
      const wantsBr = /\bbr\b/i.test(acceptEnc);
      const wantsGzip = /\bgzip\b/i.test(acceptEnc);
      if (wantsBr) {
        const buf = zlib.brotliCompressSync(Buffer.from(js, "utf8"), {
          params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 }
        });
        res.setHeader("Content-Encoding", "br");
        res.setHeader("Vary", "Accept-Encoding");
        return res.send(buf);
      }
      if (wantsGzip) {
        const buf = zlib.gzipSync(Buffer.from(js, "utf8"), { level: 9 });
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");
        return res.send(buf);
      }
      res.setHeader("Vary", "Accept-Encoding");
      return res.send(js);
    } catch (err) {
      return next(err);
    }
  });

  router.use("/oauth/salla", createOAuthRouter(config));

  function getMediaFolderPrefix() {
    return String(config?.media?.folderPrefix || "malak_uploader").trim() || "malak_uploader";
  }

  function requireR2Config() {
    const endpoint = String(config?.r2?.endpoint || "").trim();
    const bucket = String(config?.r2?.bucket || "").trim();
    const accessKeyId = String(config?.r2?.accessKeyId || "").trim();
    const secretAccessKey = String(config?.r2?.secretAccessKey || "").trim();
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new ApiError(500, "R2 is not configured", { code: "R2_NOT_CONFIGURED" });
    }
    return { endpoint, bucket, accessKeyId, secretAccessKey };
  }

  function isR2Configured() {
    const endpoint = String(config?.r2?.endpoint || "").trim();
    const bucket = String(config?.r2?.bucket || "").trim();
    const accessKeyId = String(config?.r2?.accessKeyId || "").trim();
    const secretAccessKey = String(config?.r2?.secretAccessKey || "").trim();
    return Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
  }

  function getMediaProviderOrThrow() {
    if (isR2Configured()) return "r2";
    throw new ApiError(500, "R2 is not configured", { code: "R2_NOT_CONFIGURED" });
  }

  function getR2Client() {
    if (r2Client) return r2Client;
    const { endpoint, accessKeyId, secretAccessKey } = requireR2Config();
    r2Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey }
    });
    return r2Client;
  }

  async function r2PresignPut({ key, contentType }) {
    const { bucket } = requireR2Config();
    const client = getR2Client();
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: String(key),
      ...(contentType ? { ContentType: String(contentType) } : {})
    });
    return await getSignedUrl(client, cmd, { expiresIn: 5 * 60 });
  }

  async function r2HeadObject(key) {
    const { bucket } = requireR2Config();
    const client = getR2Client();
    return await client.send(new HeadObjectCommand({ Bucket: bucket, Key: String(key) }));
  }

  async function r2DeleteObject(key) {
    const { bucket } = requireR2Config();
    const client = getR2Client();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: String(key) }));
  }

  function encodeCopySource(bucket, key) {
    const b = String(bucket);
    const k = String(key).split("/").map((p) => encodeURIComponent(p)).join("/");
    return `${b}/${k}`;
  }

  async function r2CopyObject(fromKey, toKey) {
    const { bucket } = requireR2Config();
    const client = getR2Client();
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: String(toKey),
        CopySource: encodeCopySource(bucket, String(fromKey))
      })
    );
  }

  async function r2ListObjectsV2({ prefix, continuationToken, maxKeys }) {
    const { bucket } = requireR2Config();
    const client = getR2Client();
    const mk = Number(maxKeys || 0) || 0;
    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: String(prefix || ""),
      ...(continuationToken ? { ContinuationToken: String(continuationToken) } : {}),
      ...(mk ? { MaxKeys: Math.max(1, Math.min(1000, mk)) } : {})
    });
    const resp = await client.send(cmd);
    const contents = Array.isArray(resp?.Contents) ? resp.Contents : [];
    const items = contents
      .map((o) => ({
        key: String(o?.Key || ""),
        size: o?.Size != null ? Number(o.Size) : 0,
        lastModified: o?.LastModified ? new Date(o.LastModified) : null
      }))
      .filter((it) => Boolean(it.key));
    const isTruncated = Boolean(resp?.IsTruncated);
    const nextToken = isTruncated ? String(resp?.NextContinuationToken || "").trim() || null : null;
    return { items, nextToken };
  }

  async function streamToBuffer(body, maxBytes) {
    const cap = Math.max(0, Number(maxBytes || 0) || 0);
    const chunks = [];
    let total = 0;
    for await (const chunk of body) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (!cap) {
        chunks.push(buf);
        total += buf.length;
        continue;
      }
      const remaining = cap - total;
      if (remaining <= 0) break;
      if (buf.length <= remaining) {
        chunks.push(buf);
        total += buf.length;
      } else {
        chunks.push(buf.slice(0, remaining));
        total += remaining;
        break;
      }
    }
    return Buffer.concat(chunks, total);
  }

  async function ensureSvgSafeR2OrThrow(key) {
    const { bucket } = requireR2Config();
    const client = getR2Client();
    let resp = null;
    try {
      resp = await client.send(new GetObjectCommand({ Bucket: bucket, Key: String(key), Range: "bytes=0-524287" }));
    } catch (e) {
      throw new ApiError(403, "Invalid SVG", { code: "SVG_INVALID", details: { message: String(e?.message || e) } });
    }
    const body = resp && resp.Body ? await streamToBuffer(resp.Body, 512 * 1024) : Buffer.from("");
    const text = body.toString("utf8");
    if (!svgLooksSafe(text)) throw new ApiError(403, "Invalid SVG", { code: "SVG_INVALID" });
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
      shortCode: doc.shortCode || null,
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

  function sleep(ms) {
    const n = Number(ms || 0) || 0;
    return new Promise((resolve) => globalThis.setTimeout(resolve, Math.max(0, n)));
  }

  function getPlanLimits(planKey) {
    const k = String(planKey || "").trim().toLowerCase();
    if (k === "pro") {
      return {
        maxFileBytes: bytesFromMb(30),
        maxStorageBytes: bytesFromGb(20),
        linkLeafLength: 12
      };
    }
    if (k === "business") {
      return {
        maxFileBytes: bytesFromMb(50),
        maxStorageBytes: bytesFromGb(50),
        linkLeafLength: 6
      };
    }
    return {
      maxFileBytes: bytesFromMb(10),
      maxStorageBytes: bytesFromGb(5),
      linkLeafLength: 40
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

  function randomShortCode(length) {
    const len = Math.max(8, Math.min(24, Number(length || 0) || 0));
    return randomLeaf(len);
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
    const s = String(text || "").replace(/^\uFEFF/, "");
    if (!s) return false;
    if (/<\?xml-stylesheet\b/i.test(s)) return false;
    if (/<!doctype\b/i.test(s)) return false;
    if (/<!entity\b/i.test(s)) return false;
    if (/<script\b/i.test(s)) return false;
    if (/<foreignObject\b/i.test(s)) return false;
    if (/\bon\w+\s*=/i.test(s)) return false;
    if (/\bhref\s*=\s*(["']?)\s*javascript:/i.test(s)) return false;
    if (/\bxlink:href\s*=\s*(["']?)\s*javascript:/i.test(s)) return false;
    if (/\bhref\s*=\s*(["']?)\s*(https?:|data:|\/\/)/i.test(s)) return false;
    if (/\bxlink:href\s*=\s*(["']?)\s*(https?:|data:|\/\/)/i.test(s)) return false;
    if (/\bstyle\s*=\s*(["'])[\s\S]*?expression\s*\(/i.test(s)) return false;
    if (/\bstyle\s*=\s*(["'])[\s\S]*?url\s*\(\s*javascript:/i.test(s)) return false;
    return true;
  }

  function bundleAppMarkSvgContent(id, opacity) {
    const gid = String(id || "g").trim() || "g";
    const o = opacity != null && Number.isFinite(Number(opacity)) ? Math.max(0, Math.min(1, Number(opacity))) : 1;
    return (
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">` +
      '<stop offset="0" stop-color="#18b5d5"/><stop offset="1" stop-color="#0b1220"/>' +
      "</linearGradient></defs>" +
      `<g opacity="${o}">` +
      `<circle cx="128" cy="128" r="120" fill="url(#${gid})"/>` +
      '<circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="6"/>' +
      '<rect x="84" y="92" width="28" height="72" rx="14" fill="rgba(255,255,255,0.92)"/>' +
      '<rect x="114" y="76" width="28" height="104" rx="14" fill="rgba(255,255,255,0.92)"/>' +
      '<rect x="144" y="92" width="28" height="72" rx="14" fill="rgba(255,255,255,0.92)"/>' +
      "</g>"
    );
  }

  function bundleAppMarkSvg(sizePx, opacity) {
    const s = sizePx != null && Number.isFinite(Number(sizePx)) ? Math.max(32, Math.min(2048, Math.round(Number(sizePx)))) : 256;
    const id = `g${Math.random().toString(16).slice(2)}`;
    return `<svg width="${s}" height="${s}" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">${bundleAppMarkSvgContent(id, opacity)}</svg>`;
  }

  function placeholderSvg() {
    const w = 1200;
    const h = 630;
    const size = 520;
    const x = Math.round((w - size) / 2);
    const y = Math.round((h - size) / 2);
    const id = `g${Math.random().toString(16).slice(2)}`;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#18b5d5"/><stop offset="1" stop-color="#0b1220"/></linearGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#${id})"/>` +
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">` +
      bundleAppMarkSvgContent(`m${Math.random().toString(16).slice(2)}`, 1) +
      "</svg>" +
      "</svg>"
    );
  }

  async function loadMerchantWatermarkLogoPng({ merchant, storeId, maxWidth }) {
    const id = String(merchant?.mediaWatermarkLogoAssetId || "").trim();
    if (!id) return null;
    let logo = null;
    try {
      logo = await MediaAsset.findOne({ _id: id, storeId, deletedAt: null }).lean();
    } catch (e) {
      void e;
      logo = null;
    }
    if (!logo || String(logo.resourceType) !== "image") return null;

    const provider = String(logo?.cloudinary?.__provider || logo?.cloudinary?.provider || "").trim().toLowerCase();
    let buf = null;

    if (provider === "r2") {
      const key = String(logo.publicId || "").trim();
      if (!key) return null;
      const { bucket } = requireR2Config();
      const client = getR2Client();
      let obj = null;
      try {
        obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      } catch (e) {
        void e;
        return null;
      }
      buf = obj && obj.Body ? await streamToBuffer(obj.Body, 10 * 1024 * 1024) : Buffer.from("");
    } else {
      const url = String(logo.secureUrl || logo.url || "").trim();
      if (!url) return null;
      let resp = null;
      try {
        resp = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 15000,
          maxContentLength: 5 * 1024 * 1024,
          maxBodyLength: 5 * 1024 * 1024,
          validateStatus: () => true
        });
      } catch (e) {
        void e;
        return null;
      }
      const status = Number(resp?.status || 0) || 0;
      if (status >= 400) return null;
      const data = resp && resp.data ? resp.data : null;
      buf = data ? Buffer.from(data) : Buffer.from("");
    }

    if (!buf || !buf.length) return null;
    const w = maxWidth != null && Number.isFinite(Number(maxWidth)) ? Math.max(16, Math.min(1024, Math.round(Number(maxWidth)))) : 260;
    try {
      return await sharp(buf).resize({ width: w, withoutEnlargement: true }).png().toBuffer();
    } catch (e) {
      void e;
      return null;
    }
  }

  function externalOriginFromReq(req) {
    const xfProtoRaw = String(req?.headers?.["x-forwarded-proto"] || "");
    const xfProto = xfProtoRaw ? String(xfProtoRaw.split(",")[0] || "").trim().toLowerCase() : "";
    const proto = xfProto || (req && req.secure ? "https" : "http");
    const xfHostRaw = String(req?.headers?.["x-forwarded-host"] || "");
    const xfHost = xfHostRaw ? String(xfHostRaw.split(",")[0] || "").trim() : "";
    const host = xfHost || String(req?.headers?.host || "").trim();
    if (!host) return "";
    return `${proto}://${host}`;
  }

  router.get("/media/logo.svg", (req, res) => {
    const size = req.query && req.query.size != null ? Number(req.query.size) : null;
    const s = size != null && Number.isFinite(size) ? Math.max(32, Math.min(2048, Math.round(size))) : 256;
    const svg = bundleAppMarkSvg(s, 1);
    res.status(200);
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(svg);
  });

  const mediaWatermarkPngParamsSchema = Joi.object({
    storeId: Joi.string().trim().min(1).max(80).required()
  });

  router.get("/media/watermark/:storeId.png", validate(mediaWatermarkPngParamsSchema, "params"), async (req, res, next) => {
    try {
      const storeId = String(req.params.storeId).trim();
      const w = req.query && req.query.w != null ? Number(req.query.w) : null;
      const maxWidth = w != null && Number.isFinite(w) ? Math.max(32, Math.min(1024, Math.round(w))) : 360;

      const merchant = await findMerchantByMerchantId(storeId);
      let out = merchant ? await loadMerchantWatermarkLogoPng({ merchant, storeId, maxWidth }) : null;

      if (!out || !out.length) {
        try {
          out = await sharp(Buffer.from(bundleAppMarkSvg(maxWidth, 0.9))).png().toBuffer();
        } catch (e) {
          void e;
          out = Buffer.from("");
        }
      }

      res.status(200);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Content-Length", String(Buffer.byteLength(out)));
      return res.send(out);
    } catch (err) {
      return next(err);
    }
  });

  function pickHostFromUrlLike(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      return new URL(raw).hostname || "";
    } catch {
      return "";
    }
  }

  function normalizeHostLike(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const viaUrl = raw.includes("://") ? pickHostFromUrlLike(raw) : "";
    const base = viaUrl || raw.split("/")[0] || "";
    const host = String(base).trim().toLowerCase();
    if (!host) return "";
    const withoutPort = host.includes(":") ? host.split(":")[0] : host;
    return String(withoutPort || "").trim();
  }

  function hostEquals(needleHost, allowedHost) {
    const n = normalizeHostLike(needleHost);
    const a = normalizeHostLike(allowedHost);
    if (!n || !a) return false;
    if (n === a) return true;
    if (n === `www.${a}`) return true;
    if (a === `www.${n}`) return true;
    return false;
  }

  function buildAllowedHosts({ domainHost, urlHost }) {
    const domain = normalizeHostLike(domainHost);
    const url = normalizeHostLike(urlHost);

    const out = [];
    if (url) out.push(url);

    if (domain && domain !== url) {
      const domainParts = domain.split(".").filter(Boolean);
      const shouldDropDomain = url && url.endsWith(`.${domain}`) && domainParts.length <= 2;
      if (!shouldDropDomain) out.push(domain);
    }

    const withWww = [];
    for (const h of out) {
      withWww.push(h);
      if (h.startsWith("www.")) withWww.push(h.slice(4));
      else withWww.push(`www.${h}`);
    }

    return Array.from(new Set(withWww.concat(["localhost", "127.0.0.1"]).filter(Boolean)));
  }

  const mediaDeliveryParamsSchema = Joi.object({
    storeId: Joi.string().trim().min(1).max(80).required(),
    leaf: Joi.string().trim().min(6).max(64).required()
  });

  const mediaDeliveryCodeParamsSchema = Joi.object({
    code: Joi.string().trim().min(8).max(24).required()
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

  router.get("/p/:code", validate(mediaDeliveryCodeParamsSchema, "params"), async (req, res, next) => {
    try {
      const code = String(req.params.code);
      const asset0 = await MediaAsset.findOne({ shortCode: code, deletedAt: null }).lean();
      if (!asset0) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
      const storeId = String(asset0.storeId || "").trim();
      if (!storeId) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

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

      const allowedHosts = buildAllowedHosts({ domainHost: domain, urlHost: storeUrlHost });
      const allowedHostOk = Boolean(h) && (allowedHosts.some((a) => hostEquals(h, a)) || hostEquals(h, req.headers.host));

      const cookies = parseCookies(req.headers.cookie);
      const sessionToken = String(cookies[MEDIA_SESSION_COOKIE] || "").trim();
      let sessionOk = false;
      if (sessionToken) {
        try {
          ensureValidMediaSessionToken(sessionToken, storeId, req.headers["user-agent"]);
          sessionOk = true;
        } catch (e) {
          void e;
        }
      }

      if (!allowedHostOk && !sessionOk) throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });

      const token = String(req.query?.token || "").trim();
      if (storeId === "sandbox" && token === "sandbox") {
        void token;
      } else if (token) {
        ensureValidStorefrontToken(token, storeId);
      }

      let setSessionCookie = null;
      if (allowedHostOk && !sessionOk) {
        try {
          const t = issueMediaSessionToken({ storeId, userAgent: req.headers["user-agent"] });
          const xf = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
          const secure = Boolean(req.secure) || xf.indexOf("https") >= 0;
          const base = `${MEDIA_SESSION_COOKIE}=${t}; Path=/; Max-Age=${12 * 60 * 60}; HttpOnly; SameSite=Lax`;
          setSessionCookie = secure ? `${base}; Secure` : base;
        } catch (e) {
          void e;
        }
      }

      const accept = String(req.headers.accept || "");
      const wantsHtml = /text\/html/i.test(accept);
      if (token && wantsHtml) {
        try {
          const origin = externalOriginFromReq(req);
          const u = new URL(String(req.originalUrl || req.url || ""), origin || "http://localhost");
          u.searchParams.delete("token");
          if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
          res.setHeader("Cache-Control", "private, no-store, max-age=0");
          res.setHeader("Vary", "Origin, Referer, Cookie");
          res.redirect(302, u.pathname + (u.search ? u.search : ""));
          return;
        } catch (e) {
          void e;
        }
      }

      let asset = asset0;
      let publicId = String(asset?.publicId || "").trim();
      if (!publicId) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      if (stage === "placeholder") {
        const rt = String(asset.resourceType || "");
        const placeholderId =
          rt === "image"
            ? String(merchant?.mediaPlaceholderImageAssetId || "").trim()
            : rt === "video"
              ? String(merchant?.mediaPlaceholderVideoAssetId || "").trim()
              : "";
        let placeholderAsset = null;
        if (placeholderId) {
          try {
            const ph = await MediaAsset.findOne({ _id: placeholderId, storeId, deletedAt: null }).lean();
            if (ph && String(ph.resourceType) === rt) placeholderAsset = ph;
          } catch (e) {
            void e;
          }
        }
        if (!placeholderAsset) {
          res.status(200);
          res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
          res.setHeader("Cache-Control", "public, max-age=60");
          return res.send(placeholderSvg());
        }
        asset = placeholderAsset;
        publicId = String(asset?.publicId || "").trim();
        if (!publicId) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
      }

      const provider = String(asset?.cloudinary?.__provider || asset?.cloudinary?.provider || "").trim().toLowerCase();

      if (provider === "r2") {
        const key = String(asset.publicId || publicId).trim() || publicId;
        if (!key) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

        const range = String(req.headers.range || "").trim();
        const wantsRange = Boolean(range);

        if (stage === "watermark" && String(asset.resourceType) === "image") {
          const { bucket } = requireR2Config();
          const client = getR2Client();
          let obj = null;
          try {
            obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
          } catch {
            throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
          }

          const body = obj && obj.Body ? await streamToBuffer(obj.Body, 25 * 1024 * 1024) : Buffer.from("");
          if (!body || !body.length) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

          const ext = String(asset.format || "").trim().toLowerCase();
          const fmt = ext === "png" ? "png" : ext === "webp" ? "webp" : ext === "avif" ? "avif" : "jpeg";

          const wmPng = await loadMerchantWatermarkLogoPng({ merchant, storeId, maxWidth: 260 });
          const wmInput = wmPng && wmPng.length ? wmPng : Buffer.from(bundleAppMarkSvg(260, 0.9));

          let out = null;
          try {
            out = await sharp(body).composite([{ input: wmInput, gravity: "southeast" }]).toFormat(fmt).toBuffer();
          } catch (e) {
            void e;
            out = body;
          }

          if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
          res.status(200);
          res.setHeader("Content-Type", fmt === "png" ? "image/png" : fmt === "webp" ? "image/webp" : fmt === "avif" ? "image/avif" : "image/jpeg");
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.setHeader("Vary", "Origin, Referer, Cookie");
          return res.send(out);
        }

        const { bucket } = requireR2Config();
        const client = getR2Client();
        let obj = null;
        try {
          obj = await client.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: key,
              ...(wantsRange ? { Range: range } : {})
            })
          );
        } catch {
          throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
        }

        if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
        if (wantsRange && obj && obj.ContentRange) res.setHeader("Content-Range", String(obj.ContentRange));
        if (wantsRange && obj && obj.AcceptRanges) res.setHeader("Accept-Ranges", String(obj.AcceptRanges));
        if (wantsRange && obj && obj.ContentLength != null) res.setHeader("Content-Length", String(obj.ContentLength));
        if (obj && obj.ContentType) res.setHeader("Content-Type", String(obj.ContentType));
        res.status(wantsRange ? 206 : 200);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Vary", "Origin, Referer, Cookie");
        return obj && obj.Body ? obj.Body.pipe(res) : res.end();
      }

      const secureUrl = String(asset.secureUrl || asset.url || "").trim();
      if (!secureUrl) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      if (stage === "watermark" && String(asset.resourceType) === "image") {
        let buf = null;
        try {
          const r = await axios.get(secureUrl, { responseType: "arraybuffer", timeout: 20_000, maxContentLength: 25 * 1024 * 1024 });
          buf = Buffer.from(r.data);
        } catch {
          throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
        }

        const ext = String(asset.format || "").trim().toLowerCase();
        const fmt = ext === "png" ? "png" : ext === "webp" ? "webp" : ext === "avif" ? "avif" : "jpeg";

        const wmPng = await loadMerchantWatermarkLogoPng({ merchant, storeId, maxWidth: 260 });
        const wmInput = wmPng && wmPng.length ? wmPng : Buffer.from(bundleAppMarkSvg(260, 0.9));

        let out = null;
        try {
          out = await sharp(buf).composite([{ input: wmInput, gravity: "southeast" }]).toFormat(fmt).toBuffer();
        } catch (e) {
          void e;
          out = buf;
        }

        if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
        res.status(200);
        res.setHeader("Content-Type", fmt === "png" ? "image/png" : fmt === "webp" ? "image/webp" : fmt === "avif" ? "image/avif" : "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Vary", "Origin, Referer, Cookie");
        return res.send(out);
      }

      try {
        const resp = await axios.get(secureUrl, {
          responseType: "stream",
          timeout: 20_000,
          validateStatus: () => true,
          headers: {
            ...(req.headers.range ? { range: String(req.headers.range) } : {})
          }
        });

        if (!resp || resp.status < 200 || resp.status >= 400) throw new Error("upstream");

        if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
        res.status(resp.status === 206 ? 206 : 200);
        if (resp.headers && resp.headers["content-type"]) res.setHeader("Content-Type", String(resp.headers["content-type"]));
        if (resp.headers && resp.headers["content-length"]) res.setHeader("Content-Length", String(resp.headers["content-length"]));
        if (resp.headers && resp.headers["content-range"]) res.setHeader("Content-Range", String(resp.headers["content-range"]));
        if (resp.headers && resp.headers["accept-ranges"]) res.setHeader("Accept-Ranges", String(resp.headers["accept-ranges"]));
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Vary", "Origin, Referer, Cookie");
        return resp.data.pipe(res);
      } catch {
        throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
      }
    } catch (err) {
      return next(err);
    }
  });

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

      const allowedHosts = buildAllowedHosts({ domainHost: domain, urlHost: storeUrlHost });
      const allowedHostOk = Boolean(h) && (allowedHosts.some((a) => hostEquals(h, a)) || hostEquals(h, req.headers.host));

      const cookies = parseCookies(req.headers.cookie);
      const sessionToken = String(cookies[MEDIA_SESSION_COOKIE] || "").trim();
      let sessionOk = false;
      if (sessionToken) {
        try {
          ensureValidMediaSessionToken(sessionToken, storeId, req.headers["user-agent"]);
          sessionOk = true;
        } catch (e) {
          void e;
        }
      }

      if (!allowedHostOk && !sessionOk) throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });

      const token = String(req.query?.token || "").trim();
      if (storeId === "sandbox" && token === "sandbox") {
        void token;
      } else if (token) {
        ensureValidStorefrontToken(token, storeId);
      }

      let setSessionCookie = null;
      if (allowedHostOk && !sessionOk) {
        try {
          const t = issueMediaSessionToken({ storeId, userAgent: req.headers["user-agent"] });
          const xf = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
          const secure = Boolean(req.secure) || xf.indexOf("https") >= 0;
          const base = `${MEDIA_SESSION_COOKIE}=${t}; Path=/; Max-Age=${12 * 60 * 60}; HttpOnly; SameSite=Lax`;
          setSessionCookie = secure ? `${base}; Secure` : base;
        } catch (e) {
          void e;
        }
      }

      const accept = String(req.headers.accept || "");
      const wantsHtml = /text\/html/i.test(accept);
      if (token && wantsHtml) {
        try {
          const origin = externalOriginFromReq(req);
          const u = new URL(String(req.originalUrl || req.url || ""), origin || "http://localhost");
          u.searchParams.delete("token");
          if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
          res.setHeader("Cache-Control", "private, no-store, max-age=0");
          res.setHeader("Vary", "Origin, Referer, Cookie");
          res.redirect(302, u.pathname + (u.search ? u.search : ""));
          return;
        } catch (e) {
          void e;
        }
      }

      const folderPrefix = getMediaFolderPrefix();
      const folder = mediaFolderForMerchant(folderPrefix, storeId);
      const publicId = `${folder}/${leaf}`;
      let asset = await MediaAsset.findOne({ storeId, publicId, deletedAt: null }).lean();
      if (!asset) {
        const escapedLeaf = String(leaf).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        asset = await MediaAsset.findOne({ storeId, deletedAt: null, publicId: new RegExp(`/${escapedLeaf}$`) }).lean();
      }
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      if (stage === "placeholder") {
        const rt = String(asset.resourceType || "");
        const placeholderId =
          rt === "image"
            ? String(merchant?.mediaPlaceholderImageAssetId || "").trim()
            : rt === "video"
              ? String(merchant?.mediaPlaceholderVideoAssetId || "").trim()
              : "";
        let placeholderAsset = null;
        if (placeholderId) {
          try {
            const ph = await MediaAsset.findOne({ _id: placeholderId, storeId, deletedAt: null }).lean();
            if (ph && String(ph.resourceType) === rt) placeholderAsset = ph;
          } catch (e) {
            void e;
          }
        }
      if (!placeholderAsset) {
        res.status(200);
        res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=60");
        return res.send(placeholderSvg());
      }
      asset = placeholderAsset;
    }

      const provider = String(asset?.cloudinary?.__provider || asset?.cloudinary?.provider || "").trim().toLowerCase();

      if (provider === "r2") {
        const key = String(asset.publicId || publicId).trim() || publicId;
        if (!key) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

        const range = String(req.headers.range || "").trim();
        const wantsRange = Boolean(range);

        if (stage === "watermark" && String(asset.resourceType) === "image") {
          const { bucket } = requireR2Config();
          const client = getR2Client();
          let obj = null;
          try {
            obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
          } catch {
            throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
          }

          const body = obj && obj.Body ? await streamToBuffer(obj.Body, 25 * 1024 * 1024) : Buffer.from("");
          if (!body || !body.length) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

          const ext = String(asset.format || "").trim().toLowerCase();
          const fmt = ext === "png" ? "png" : ext === "webp" ? "webp" : ext === "avif" ? "avif" : "jpeg";

          const wmPng = await loadMerchantWatermarkLogoPng({ merchant, storeId, maxWidth: 260 });
          const wmInput = wmPng && wmPng.length ? wmPng : Buffer.from(bundleAppMarkSvg(260, 0.9));

          let out = null;
          try {
            out = await sharp(body).composite([{ input: wmInput, gravity: "southeast" }]).toFormat(fmt).toBuffer();
          } catch (e) {
            void e;
            out = body;
          }

          if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
          res.setHeader("Cache-Control", "private, no-store, max-age=0");
          res.setHeader("Vary", "Origin, Referer, Cookie");
          res.status(200);
          res.setHeader("Content-Type", fmt === "png" ? "image/png" : fmt === "webp" ? "image/webp" : fmt === "avif" ? "image/avif" : "image/jpeg");
          res.setHeader("Content-Length", String(Buffer.byteLength(out)));
          return res.send(out);
        }

        if (stage === "watermark" && String(asset.resourceType) === "video") {
          const { bucket } = requireR2Config();
          const client = getR2Client();
          let obj = null;
          try {
            obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
          } catch {
            throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
          }

          const inStream = obj && obj.Body && typeof obj.Body.pipe === "function" ? obj.Body : null;
          if (!inStream) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

          let wmPng = await loadMerchantWatermarkLogoPng({ merchant, storeId, maxWidth: 360 });
          if (!wmPng || !wmPng.length) {
            try {
              const wmSvg = bundleAppMarkSvg(360, 0.85);
              wmPng = await sharp(Buffer.from(wmSvg)).png().toBuffer();
            } catch (e) {
              void e;
              wmPng = null;
            }
          }
          if (!wmPng || !wmPng.length) throw new ApiError(501, "Video watermark is not supported on this server", { code: "NOT_SUPPORTED" });

          const args = [
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            "pipe:0",
            "-i",
            "pipe:3",
            "-filter_complex",
            "overlay=W-w-18:H-h-18",
            "-map_metadata",
            "-1",
            "-movflags",
            "frag_keyframe+empty_moov",
            "-pix_fmt",
            "yuv420p",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "28",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-ac",
            "2",
            "-ar",
            "48000",
            "-f",
            "mp4",
            "pipe:1"
          ];

          let stderr = "";
          const proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe", "pipe"] });

          proc.on("spawn", () => {
            try {
              if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
              res.setHeader("Cache-Control", "private, no-store, max-age=0");
              res.setHeader("Vary", "Origin, Referer, Cookie");
              res.status(200);
              res.setHeader("Content-Type", "video/mp4");
              proc.stdout.pipe(res);
            } catch (e) {
              void e;
            }
          });
          proc.on("error", (e) => {
            if (String(e && e.code) === "ENOENT") return next(new ApiError(501, "Video watermark is not supported on this server", { code: "NOT_SUPPORTED" }));
            return next(new ApiError(502, "Bad gateway", { code: "BAD_GATEWAY", details: { message: String(e?.message || e) } }));
          });
          proc.stderr.on("data", (d) => {
            try {
              if (stderr.length > 4000) return;
              stderr += String(d || "");
            } catch (e) {
              void e;
            }
          });
          res.on("close", () => {
            try {
              if (!proc.killed) proc.kill("SIGKILL");
            } catch (e) {
              void e;
            }
          });
          proc.on("close", (code) => {
            const c = Number(code || 0) || 0;
            if (c === 0) return;
            try {
              if (!res.headersSent) return next(new ApiError(400, "Watermark failed", { code: "WATERMARK_FAILED", details: { message: stderr.trim().slice(0, 1200) } }));
              try {
                res.destroy();
              } catch (e) {
                void e;
              }
            } catch (e) {
              void e;
              try {
                res.destroy();
              } catch (e2) {
                void e2;
              }
            }
          });

          try {
            inStream.pipe(proc.stdin);
          } catch (e) {
            void e;
            throw new ApiError(502, "Bad gateway", { code: "BAD_GATEWAY" });
          }
          try {
            proc.stdio[3].end(wmPng);
          } catch (e) {
            void e;
          }
          return;
        }

        const { bucket } = requireR2Config();
        const client = getR2Client();
        let obj = null;
        try {
          obj = await client.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: key,
              ...(wantsRange ? { Range: range } : {})
            })
          );
        } catch {
          throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
        }

        const ct = String(obj?.ContentType || "").trim();
        const cl = obj?.ContentLength != null ? Number(obj.ContentLength) : null;
        const cr = String(obj?.ContentRange || "").trim();
        const etag = String(obj?.ETag || "").trim();
        const lm = obj?.LastModified ? new Date(obj.LastModified) : null;

        if (ct) res.setHeader("content-type", ct);
        if (Number.isFinite(cl) && cl >= 0) res.setHeader("content-length", String(cl));
        if (cr) res.setHeader("content-range", cr);
        if (etag) res.setHeader("etag", etag);
        if (lm && !Number.isNaN(lm.getTime())) res.setHeader("last-modified", lm.toUTCString());
        res.setHeader("accept-ranges", "bytes");
        if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        res.setHeader("Vary", "Origin, Referer, Cookie");
        res.status(cr ? 206 : 200);
        if (obj?.Body && typeof obj.Body.pipe === "function") {
          obj.Body.pipe(res);
          return;
        }
        const buf = obj && obj.Body ? await streamToBuffer(obj.Body, 50 * 1024 * 1024) : Buffer.from("");
        return res.send(buf);
      }

      const baseUrl = String(asset.secureUrl || asset.url || "").trim();
      if (!baseUrl) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const nextUrl = baseUrl;

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
      if (setSessionCookie) res.setHeader("Set-Cookie", setSessionCookie);
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
      res.setHeader("Vary", "Origin, Referer, Cookie");
      res.status(status);
      upstream.data.pipe(res);
      return;
    } catch (err) {
      return next(err);
    }
  });

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

      const provider = getMediaProviderOrThrow();
      const merchantId = String(req.merchant?.merchantId || "").trim();
      const folder = mediaFolderForMerchant(getMediaFolderPrefix(), merchantId);

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

      if (provider === "r2") {
        const key = `${folder}/${publicId}`;
        const contentType = String(value?.file?.type || "").trim() || "application/octet-stream";
        const uploadUrl = await r2PresignPut({ key, contentType });
        return res.json({
          ok: true,
          cloudinary: {
            provider: "r2",
            uploadMethod: "PUT",
            uploadUrl,
            resourceType: policy.resourceType,
            folder,
            publicId,
            key,
            contentType,
            ...(contextStr ? { context: contextStr } : {}),
            ...(tagsStr ? { tags: tagsStr } : {})
          }
        });
      }
      throw new ApiError(500, "Media provider is not supported", { code: "MEDIA_PROVIDER_NOT_SUPPORTED" });
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
      const provider = String(c.__provider || c.provider || "").trim().toLowerCase();
      const isR2 = provider === "r2";
      const r2Key = isR2 ? String(c.r2_key || c.key || c.public_id || "").trim() : "";
      if (isR2) {
        if (!r2Key) throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });
        const expectedPrefix = `${getMediaFolderPrefix().replace(/\/+$/g, "")}/${storeId}/`;
        if (!r2Key.startsWith(expectedPrefix)) throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
        let head = null;
        try {
          head = await r2HeadObject(r2Key);
        } catch (e) {
          const msg = String(e?.message || e);
          throw new ApiError(404, "Not found", { code: "NOT_FOUND", details: { message: msg } });
        }
        const actualBytes = Number(head?.ContentLength || 0) || 0;
        c.bytes = actualBytes || c.bytes;
        const ct = String(head?.ContentType || "").trim().toLowerCase();
        if (!c.format && ct) {
          if (ct.includes("image/svg")) c.format = "svg";
          else if (ct.includes("image/png")) c.format = "png";
          else if (ct.includes("image/jpeg")) c.format = "jpg";
          else if (ct.includes("image/webp")) c.format = "webp";
          else if (ct.includes("image/avif")) c.format = "avif";
          else if (ct.includes("image/gif")) c.format = "gif";
          else if (ct.includes("video/mp4")) c.format = "mp4";
          else if (ct.includes("video/webm")) c.format = "webm";
          else if (ct.includes("application/pdf")) c.format = "pdf";
        }
      }

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
        if (!isR2) throw new ApiError(500, "R2 is the only supported media provider", { code: "MEDIA_PROVIDER_NOT_SUPPORTED" });
        await ensureSvgSafeR2OrThrow(r2Key);
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
          },
          $setOnInsert: {
            shortCode: randomShortCode(12)
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (doc && !doc.shortCode) {
        for (let i = 0; i < 4; i += 1) {
          const sc = randomShortCode(12);
          try {
            const r = await MediaAsset.updateOne(
              { _id: doc._id, deletedAt: null, $or: [{ shortCode: null }, { shortCode: { $exists: false } }] },
              { $set: { shortCode: sc } }
            );
            if (r && (r.modifiedCount || r.nModified)) {
              doc.shortCode = sc;
              break;
            }
          } catch (e) {
            void e;
          }
        }
      }

      const rt = String(c.resource_type || "").trim().toLowerCase();
      if (process.env.NODE_ENV !== "test" && planKey === "basic" && (rt === "image" || rt === "video")) {
        await sleep(10_000);
      }

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

  const mediaBrandingBodySchema = Joi.object({
    watermarkLogoAssetId: Joi.string().trim().min(8).max(64).allow("", null),
    placeholderImageAssetId: Joi.string().trim().min(8).max(64).allow("", null),
    placeholderVideoAssetId: Joi.string().trim().min(8).max(64).allow("", null)
  }).required();

  async function resolveBrandingAssetOrThrow({ storeId, assetId, expectedType }) {
    const id = String(assetId || "").trim();
    if (!id) return null;
    const doc = await MediaAsset.findOne({ _id: id, storeId, deletedAt: null }).lean();
    if (!doc) throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });
    if (String(doc.resourceType) !== String(expectedType)) throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });
    return doc;
  }

  router.get("/media/branding", merchantAuth(config), async (req, res, next) => {
    try {
      const merchantId = String(req.merchant?.merchantId || "").trim();
      const storeId = merchantId;

      const watermarkLogoAssetId = String(req.merchant?.mediaWatermarkLogoAssetId || "").trim() || null;
      const placeholderImageAssetId = String(req.merchant?.mediaPlaceholderImageAssetId || "").trim() || null;
      const placeholderVideoAssetId = String(req.merchant?.mediaPlaceholderVideoAssetId || "").trim() || null;

      const [logo, imgPh, vidPh] = await Promise.all([
        watermarkLogoAssetId ? MediaAsset.findOne({ _id: watermarkLogoAssetId, storeId, deletedAt: null }).lean() : null,
        placeholderImageAssetId ? MediaAsset.findOne({ _id: placeholderImageAssetId, storeId, deletedAt: null }).lean() : null,
        placeholderVideoAssetId ? MediaAsset.findOne({ _id: placeholderVideoAssetId, storeId, deletedAt: null }).lean() : null
      ]);

      return res.json({
        ok: true,
        branding: {
          watermarkLogoAssetId,
          placeholderImageAssetId,
          placeholderVideoAssetId,
          watermarkLogo: logo ? serializeMediaAsset(logo) : null,
          placeholderImage: imgPh ? serializeMediaAsset(imgPh) : null,
          placeholderVideo: vidPh ? serializeMediaAsset(vidPh) : null
        }
      });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/media/branding", merchantAuth(config), async (req, res, next) => {
    try {
      const { error, value } = mediaBrandingBodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const merchantId = String(req.merchant?.merchantId || "").trim();
      const storeId = merchantId;

      const logoId = String(value.watermarkLogoAssetId || "").trim();
      const imgPhId = String(value.placeholderImageAssetId || "").trim();
      const vidPhId = String(value.placeholderVideoAssetId || "").trim();

      const [logo, imgPh, vidPh] = await Promise.all([
        resolveBrandingAssetOrThrow({ storeId, assetId: logoId, expectedType: "image" }),
        resolveBrandingAssetOrThrow({ storeId, assetId: imgPhId, expectedType: "image" }),
        resolveBrandingAssetOrThrow({ storeId, assetId: vidPhId, expectedType: "video" })
      ]);

      req.merchant.mediaWatermarkLogoAssetId = logo ? String(logo._id) : null;
      req.merchant.mediaPlaceholderImageAssetId = imgPh ? String(imgPh._id) : null;
      req.merchant.mediaPlaceholderVideoAssetId = vidPh ? String(vidPh._id) : null;
      await req.merchant.save();

      return res.json({
        ok: true,
        branding: {
          watermarkLogoAssetId: req.merchant.mediaWatermarkLogoAssetId,
          placeholderImageAssetId: req.merchant.mediaPlaceholderImageAssetId,
          placeholderVideoAssetId: req.merchant.mediaPlaceholderVideoAssetId,
          watermarkLogo: logo ? serializeMediaAsset(logo) : null,
          placeholderImage: imgPh ? serializeMediaAsset(imgPh) : null,
          placeholderVideo: vidPh ? serializeMediaAsset(vidPh) : null
        }
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

      const merchantId = String(req.merchant?.merchantId || "").trim();
      const storeId = merchantId;
      const folderPrefix = getMediaFolderPrefix();
      const folder = mediaFolderForMerchant(folderPrefix, merchantId);
      getMediaProviderOrThrow();

      const maxResults = Number(value.maxResults);

      const upserted = [];
      const errors = [];

      const wanted = new Set(value.resourceType === "all" ? ["image", "video", "raw"] : [String(value.resourceType || "raw")]);
      const cleanFolder = String(folder || "").replace(/\/+$/g, "");
      const prefix = cleanFolder ? `${cleanFolder}/` : "";
      let remaining = maxResults;
      let token = null;

      const inferResourceType = (key) => {
        const k = String(key || "");
        const leaf = k.includes("/") ? k.split("/").pop() : k;
        const dot = leaf.lastIndexOf(".");
        const ext = dot > 0 ? leaf.slice(dot + 1).toLowerCase() : "";
        const img = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "bmp", "tif", "tiff", "heic"]);
        const vid = new Set(["mp4", "webm", "mov", "m4v", "mkv"]);
        if (img.has(ext)) return { resourceType: "image", ext };
        if (vid.has(ext)) return { resourceType: "video", ext };
        return { resourceType: "raw", ext: ext || "" };
      };

      while (remaining > 0) {
        let resp = null;
        try {
          resp = await r2ListObjectsV2({ prefix, continuationToken: token, maxKeys: Math.min(1000, Math.max(50, remaining * 4)) });
        } catch (e) {
          errors.push({ resourceType: "all", message: String(e?.message || e) });
          break;
        }

        const items = Array.isArray(resp?.items) ? resp.items : [];
        token = resp?.nextToken || null;

        for (const it of items) {
          const key = String(it?.key || "").trim();
          if (!key || key.endsWith("/")) continue;
          const { resourceType, ext } = inferResourceType(key);
          if (!wanted.has(resourceType)) continue;

          const baseDir = key.includes("/") ? key.split("/").slice(0, -1).join("/") : "";
          const leaf = key.includes("/") ? key.split("/").pop() : key;
          const lastMod = it?.lastModified && !Number.isNaN(it.lastModified.getTime()) ? it.lastModified : null;
          const createdAtIso = lastMod ? lastMod.toISOString() : null;
          const cloudinaryCreatedAt = lastMod ? lastMod : null;

          const r = {
            __provider: "r2",
            provider: "r2",
            r2_key: key,
            key,
            public_id: key,
            asset_id: null,
            resource_type: resourceType,
            secure_url: null,
            url: null,
            bytes: it?.size != null ? Number(it.size) : null,
            format: ext || null,
            width: null,
            height: null,
            duration: null,
            original_filename: leaf || null,
            folder: baseDir || null,
            tags: [],
            context: null,
            created_at: createdAtIso
          };

          const doc = await MediaAsset.findOneAndUpdate(
            { storeId, publicId: String(r.public_id), deletedAt: null },
            {
              $set: {
                merchantId,
                storeId,
                resourceType: String(r.resource_type),
                publicId: String(r.public_id),
                assetId: null,
                folder: r.folder ? String(r.folder) : null,
                originalFilename: r.original_filename ? String(r.original_filename) : null,
                format: r.format ? String(r.format) : null,
                bytes: r.bytes != null ? Number(r.bytes) : null,
                width: null,
                height: null,
                duration: null,
                url: null,
                secureUrl: null,
                thumbnailUrl: null,
                tags: [],
                context: null,
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

        if (!token || !items.length) break;
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
      const merchantId = String(req.merchant?.merchantId || "").trim();
      const storeId = merchantId;
      const id = String(req.params.id);

      const asset = await MediaAsset.findOne({ _id: id, storeId, deletedAt: null });
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const provider = String(asset?.cloudinary?.__provider || asset?.cloudinary?.provider || "").trim().toLowerCase();
      if (provider !== "r2") throw new ApiError(400, "Unsupported media provider", { code: "UNSUPPORTED_MEDIA_PROVIDER" });
      const expectedPrefix = `${getMediaFolderPrefix().replace(/\/+$/g, "")}/${storeId}/`;
      if (!String(asset.publicId || "").startsWith(expectedPrefix)) {
        throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
      }
      await r2DeleteObject(String(asset.publicId));

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

  router.get("/public/media/assets/:id/blob", validate(mediaDeleteParamsSchema, "params"), async (req, res, next) => {
    try {
      requireMediaAdminKey(req);
      const id = String(req.params.id);

      const asset = await MediaAsset.findOne({ _id: id, deletedAt: null }).lean();
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const provider = String(asset?.cloudinary?.__provider || asset?.cloudinary?.provider || "").trim().toLowerCase();

      if (provider === "r2") {
        const { bucket } = requireR2Config();
        const client = getR2Client();
        const key = String(asset.publicId || "").trim();
        if (!key) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

        const range = String(req.headers.range || "").trim();
        const wantsRange = Boolean(range);

        let obj = null;
        try {
          obj = await client.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: key,
              ...(wantsRange ? { Range: range } : {})
            })
          );
        } catch {
          throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
        }

        if (wantsRange && obj && obj.ContentRange) res.setHeader("Content-Range", String(obj.ContentRange));
        if (wantsRange && obj && obj.AcceptRanges) res.setHeader("Accept-Ranges", String(obj.AcceptRanges));
        if (wantsRange && obj && obj.ContentLength != null) res.setHeader("Content-Length", String(obj.ContentLength));
        if (obj && obj.ContentType) res.setHeader("Content-Type", String(obj.ContentType));
        res.status(wantsRange ? 206 : 200);
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        return obj && obj.Body ? obj.Body.pipe(res) : res.end();
      }

      const secureUrl = String(asset.secureUrl || asset.url || "").trim();
      if (!secureUrl) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      try {
        const resp = await axios.get(secureUrl, {
          responseType: "stream",
          timeout: 20_000,
          validateStatus: () => true,
          headers: {
            ...(req.headers.range ? { range: String(req.headers.range) } : {})
          }
        });

        if (!resp || resp.status < 200 || resp.status >= 400) throw new Error("upstream");

        res.status(resp.status === 206 ? 206 : 200);
        if (resp.headers && resp.headers["content-type"]) res.setHeader("Content-Type", String(resp.headers["content-type"]));
        if (resp.headers && resp.headers["content-length"]) res.setHeader("Content-Length", String(resp.headers["content-length"]));
        if (resp.headers && resp.headers["content-range"]) res.setHeader("Content-Range", String(resp.headers["content-range"]));
        if (resp.headers && resp.headers["accept-ranges"]) res.setHeader("Accept-Ranges", String(resp.headers["accept-ranges"]));
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        return resp.data.pipe(res);
      } catch {
        throw new ApiError(404, "Not found", { code: "NOT_FOUND" });
      }
    } catch (err) {
      return next(err);
    }
  });

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
      const id = String(req.params.id);

      const asset = await MediaAsset.findOne({ _id: id, deletedAt: null });
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const provider = String(asset?.cloudinary?.__provider || asset?.cloudinary?.provider || "").trim().toLowerCase();
      if (provider !== "r2") throw new ApiError(400, "Unsupported media provider", { code: "UNSUPPORTED_MEDIA_PROVIDER" });
      const storeId = String(asset.storeId || "").trim();
      const expectedPrefix = `${getMediaFolderPrefix().replace(/\/+$/g, "")}/${storeId}/`;
      if (!String(asset.publicId || "").startsWith(expectedPrefix)) {
        throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
      }
      await r2DeleteObject(String(asset.publicId));

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
      const id = String(req.params.id);

      const asset = await MediaAsset.findOne({ _id: id, deletedAt: null });
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const fromPublicId = String(asset.publicId || "").trim();
      if (!fromPublicId) throw new ApiError(409, "Invalid media asset", { code: "INVALID_MEDIA_ASSET" });

      const storeId = String(asset.storeId || "").trim();
      const expectedPrefix = `${getMediaFolderPrefix().replace(/\/+$/g, "")}/${storeId}/`;
      if (!fromPublicId.startsWith(expectedPrefix)) {
        throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
      }

      const baseDir = fromPublicId.includes("/") ? fromPublicId.split("/").slice(0, -1).join("/") : "";
      const newLeaf = sha256Hex(`${fromPublicId}:${Date.now()}:${Math.random()}`).slice(0, 18);
      const toPublicId = baseDir ? `${baseDir}/${newLeaf}` : newLeaf;

      const provider = String(asset?.cloudinary?.__provider || asset?.cloudinary?.provider || "").trim().toLowerCase();
      if (provider !== "r2") throw new ApiError(400, "Unsupported media provider", { code: "UNSUPPORTED_MEDIA_PROVIDER" });
      await r2CopyObject(fromPublicId, toPublicId);
      await r2DeleteObject(fromPublicId);
      asset.publicId = toPublicId;
      asset.folder = baseDir || asset.folder;
      asset.url = null;
      asset.secureUrl = null;
      asset.thumbnailUrl = null;
      if (asset.cloudinary && typeof asset.cloudinary === "object") {
        asset.cloudinary.public_id = toPublicId;
        asset.cloudinary.r2_key = toPublicId;
        asset.cloudinary.key = toPublicId;
      }
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

  const proxyMediaDashboardQuerySchema = Joi.object({
    merchantId: Joi.string().trim().min(1).max(80).required(),
    token: Joi.string().trim().min(10),
    signature: Joi.string().trim().min(8),
    hmac: Joi.string().trim().min(8)
  })
    .or("signature", "hmac", "token")
    .unknown(true);

  router.get("/proxy/media/dashboard", async (req, res, next) => {
    try {
      const { error, value } = proxyMediaDashboardQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: false });
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
      const baseStoreFilter = { storeId, deletedAt: null };

      const summaryPipeline = [
        { $match: baseStoreFilter },
        {
          $group: {
            _id: "$storeId",
            total: { $sum: 1 },
            totalBytes: { $sum: { $ifNull: ["$bytes", 0] } },
            images: { $sum: { $cond: [{ $eq: ["$resourceType", "image"] }, 1, 0] } },
            videos: { $sum: { $cond: [{ $eq: ["$resourceType", "video"] }, 1, 0] } },
            raws: { $sum: { $cond: [{ $eq: ["$resourceType", "raw"] }, 1, 0] } },
            lastCloudinaryCreatedAt: { $max: "$cloudinaryCreatedAt" },
            lastCreatedAt: { $max: "$createdAt" }
          }
        },
        { $addFields: { lastAt: { $ifNull: ["$lastCloudinaryCreatedAt", "$lastCreatedAt"] } } }
      ];

      const [storeInfo, summaryAgg] = await Promise.all([getPublicStoreInfo(storeId), MediaAsset.aggregate(summaryPipeline, { allowDiskUse: true })]);

      const summaryRoot = Array.isArray(summaryAgg) && summaryAgg.length ? summaryAgg[0] : null;
      const summary = summaryRoot
        ? {
            total: Number(summaryRoot.total || 0) || 0,
            totalBytes: Number(summaryRoot.totalBytes || 0) || 0,
            images: Number(summaryRoot.images || 0) || 0,
            videos: Number(summaryRoot.videos || 0) || 0,
            raws: Number(summaryRoot.raws || 0) || 0,
            lastAt: summaryRoot.lastAt ? new Date(summaryRoot.lastAt).toISOString() : null
          }
        : { total: 0, totalBytes: 0, images: 0, videos: 0, raws: 0, lastAt: null };

      return res.json({
        ok: true,
        merchantId: storeId,
        planKey: String(merchant.planKey || "basic"),
        store: storeInfo || null,
        summary
      });
    } catch (err) {
      return next(err);
    }
  });

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

      try {
        await Promise.all(
          docs.map(async (d) => {
            if (!d || d.shortCode) return;
            for (let i = 0; i < 4; i += 1) {
              const sc = randomShortCode(12);
              try {
                const r = await MediaAsset.updateOne(
                  { _id: d._id, deletedAt: null, $or: [{ shortCode: null }, { shortCode: { $exists: false } }] },
                  { $set: { shortCode: sc } }
                );
                if (r && (r.modifiedCount || r.nModified)) {
                  d.shortCode = sc;
                  return;
                }
              } catch (e) {
                void e;
              }
            }
          })
        );
      } catch (e) {
        void e;
      }

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

  const proxyToolsCompressQuerySchema = Joi.object({
    merchantId: Joi.string().trim().min(1).max(80).required(),
    token: Joi.string().trim().min(10),
    signature: Joi.string().trim().min(8),
    hmac: Joi.string().trim().min(8),
    format: Joi.string().trim().valid("keep", "webp", "avif", "jpeg", "png").default("keep"),
    quality: Joi.number().integer().min(1).max(80),
    name: Joi.string().trim().min(1).max(180).allow("")
  })
    .or("signature", "hmac", "token")
    .unknown(true);

  router.post("/proxy/tools/compress", express.raw({ type: () => true, limit: "55mb" }), async (req, res, next) => {
    try {
      const { error: qErr, value: qValue } = proxyToolsCompressQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: false });
      if (qErr) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: qErr.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      ensureValidProxyAuth(qValue, qValue.merchantId);

      const merchant = await findMerchantByMerchantId(String(qValue.merchantId));
      if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });
      if (merchant.appStatus !== "installed") throw new ApiError(403, "Merchant is not active", { code: "MERCHANT_INACTIVE" });

      const planKey = getPlanKey(merchant);

      const storeId = String(qValue.merchantId);
      const storeInfo = await getPublicStoreInfo(storeId);
      const domain =
        (storeInfo && storeInfo.domain ? String(storeInfo.domain).trim() : "") || (merchant && merchant.storeDomain ? String(merchant.storeDomain).trim() : "");
      const storeUrlHost =
        (storeInfo && storeInfo.url ? pickHostFromUrlLike(storeInfo.url) : "") || (merchant && merchant.storeUrl ? pickHostFromUrlLike(merchant.storeUrl) : "");
      const originHost = pickHostFromUrlLike(req.headers.origin);
      const refererHost = pickHostFromUrlLike(req.headers.referer);
      const h = originHost || refererHost;
      const allowedHosts = buildAllowedHosts({ domainHost: domain, urlHost: storeUrlHost });
      const allowedHostOk = Boolean(h) && allowedHosts.some((a) => hostEquals(h, a));
      if (!allowedHostOk) throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });

      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      if (!body.length) throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });

      const headerName = String(req.headers["x-file-name"] || "").trim();
      const baseNameRaw = String(qValue.name || headerName || "compressed").trim();
      const hintedMime = String(req.headers["content-type"] || "").trim().toLowerCase();
      const hintedExt = (() => {
        const n = String(baseNameRaw || "").trim().toLowerCase();
        const dot = n.lastIndexOf(".");
        if (dot <= 0 || dot === n.length - 1) return "";
        const ext = n.slice(dot + 1).trim().toLowerCase();
        if (ext === "jpg") return "jpeg";
        return ext;
      })();

      const limits = getPlanLimits(planKey);
      if (body.length > limits.maxFileBytes) {
        throw new ApiError(403, "File size limit exceeded", { code: "FILE_SIZE_LIMIT_EXCEEDED", details: { maxBytes: limits.maxFileBytes } });
      }

      const maxInputPixels = planKey === "business" ? 70_000_000 : 45_000_000;
      const base = sharp(body, { sequentialRead: true, failOn: "none", limitInputPixels: maxInputPixels });
      const meta = await base.metadata().catch(() => ({}));

      const srcFmtRaw = String((meta && meta.format) || "").trim().toLowerCase();
      const srcFmt = (() => {
        let f = srcFmtRaw === "jpg" ? "jpeg" : srcFmtRaw;
        const hintedIsAvif = hintedExt === "avif" || hintedMime === "image/avif";
        if (f === "heif" || f === "heic") {
          if (hintedIsAvif) return "avif";
          return "heif";
        }
        return f;
      })();
      if (!srcFmt) throw new ApiError(400, "Unsupported media", { code: "UNSUPPORTED_MEDIA" });

      const requested = String(qValue.format || "keep").trim().toLowerCase();
      const targetFormat =
        requested === "keep"
          ? (srcFmt === "webp" || srcFmt === "avif" || srcFmt === "jpeg" || srcFmt === "png" ? srcFmt : "webp")
          : requested;
      const effort = 4;

      const maxQuality = 80;
      const qRaw = qValue.quality != null ? Number(qValue.quality) : null;
      const quality =
        qRaw && Number.isFinite(qRaw)
          ? Math.max(1, Math.min(maxQuality, Math.round(qRaw)))
          : targetFormat === "avif"
            ? 55
            : targetFormat === "png"
              ? Math.min(maxQuality, 90)
              : Math.min(maxQuality, 82);

      let img = base.rotate();

      let out = null;
      let contentType = "application/octet-stream";
      let ext = "bin";

      const supported = targetFormat === "webp" || targetFormat === "avif" || targetFormat === "jpeg" || targetFormat === "png";
      if (!supported) {
        throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });
      }

      if (targetFormat === "webp") {
        out = await img.webp({ quality, effort, smartSubsample: true }).toBuffer();
        contentType = "image/webp";
        ext = "webp";
      } else if (targetFormat === "avif") {
        out = await img.avif({ quality, effort }).toBuffer();
        contentType = "image/avif";
        ext = "avif";
      } else if (targetFormat === "jpeg") {
        out = await img.jpeg({ quality, mozjpeg: true }).toBuffer();
        contentType = "image/jpeg";
        ext = "jpeg";
      } else if (targetFormat === "png") {
        const compressionLevel = quality <= 30 ? 9 : quality <= 50 ? 8 : quality <= 70 ? 7 : 6;
        out = await img.png({ compressionLevel, adaptiveFiltering: true, palette: false }).toBuffer();
        contentType = "image/png";
        ext = "png";
      } else {
        throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });
      }

      if (requested === "keep" && targetFormat === srcFmt && out && out.length && out.length >= body.length) {
        out = body;
        if (srcFmt === "png") {
          contentType = "image/png";
          ext = "png";
        } else if (srcFmt === "jpeg") {
          contentType = "image/jpeg";
          ext = "jpeg";
        } else if (srcFmt === "webp") {
          contentType = "image/webp";
          ext = "webp";
        } else if (srcFmt === "avif") {
          contentType = "image/avif";
          ext = "avif";
        }
      }

      let baseName = "";
      for (let i = 0; i < baseNameRaw.length; i += 1) {
        const ch = baseNameRaw[i];
        const code = ch.charCodeAt(0);
        if (code < 32) continue;
        if (ch === '"') continue;
        if (ch === "/" || ch === "\\") {
          baseName += "_";
          continue;
        }
        baseName += ch;
      }
      baseName = baseName.replace(/\s+/g, " ").trim().slice(0, 120);
      let baseNoExt = baseName;
      const dot = baseNoExt.lastIndexOf(".");
      if (dot > 0) baseNoExt = baseNoExt.slice(0, dot);
      const fileName = (baseNoExt || "compressed") + "." + ext;

      res.status(200);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("X-Output-Format", ext);
      res.setHeader("X-Converted-Format", ext);
      return res.send(out);
    } catch (err) {
      return next(err);
    }
  });

  const proxyToolsConvertQuerySchema = Joi.object({
    merchantId: Joi.string().trim().min(1).max(80).required(),
    token: Joi.string().trim().min(10),
    signature: Joi.string().trim().min(8),
    hmac: Joi.string().trim().min(8),
    format: Joi.string().trim().valid("keep", "webp", "avif", "jpeg", "png").default("keep"),
    quality: Joi.number().integer().min(1).max(100),
    speed: Joi.string().trim().valid("fast", "balanced", "small").default("fast"),
    preset: Joi.string()
      .trim()
      .max(20)
      .allow("")
      .default("")
      .custom((raw, helpers) => {
        const v = String(raw || "").trim().toLowerCase();
        if (!v) return "";
        if (["original", "square", "story", "banner", "thumb"].includes(v)) return v;
        if (/^\d{1,4}x\d{1,4}$/.test(v)) return v;
        return helpers.error("any.invalid");
      }),
    width: Joi.number().integer().min(1).max(6000),
    height: Joi.number().integer().min(1).max(6000),
    mode: Joi.string().trim().valid("fit", "cover").default("fit"),
    position: Joi.string().trim().valid("center", "attention", "entropy").default("center"),
    name: Joi.string().trim().min(1).max(180).allow("")
  })
    .or("signature", "hmac", "token")
    .unknown(true);

  router.post("/proxy/tools/convert", express.raw({ type: () => true, limit: "55mb" }), async (req, res, next) => {
    try {
      const { error: qErr, value: qValue } = proxyToolsConvertQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: false });
      if (qErr) {
        const details = qErr.details.map((d) => ({ message: d.message, path: d.path }));
        const fields = new Set(details.map((d) => String((d && d.path && d.path[0]) || "")));
        const msg = fields.has("preset")
          ? "المقاس غير صحيح. استخدم preset=original أو preset=WIDTHxHEIGHT مثل 512x512، أو استخدم width و height."
          : (fields.has("width") || fields.has("height"))
            ? "العرض/الارتفاع غير صحيح. استخدم width و height كأرقام من 1 إلى 6000."
            : fields.has("format")
              ? "صيغة الإخراج غير مدعومة."
              : "Validation error";
        throw new ApiError(400, msg, {
          code: "VALIDATION_ERROR",
          details
        });
      }

      ensureValidProxyAuth(qValue, qValue.merchantId);

      const merchant = await findMerchantByMerchantId(String(qValue.merchantId));
      if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });
      if (merchant.appStatus !== "installed") throw new ApiError(403, "Merchant is not active", { code: "MERCHANT_INACTIVE" });

      const planKey = getPlanKey(merchant);
      if (planKey !== "pro" && planKey !== "business") {
        throw new ApiError(403, "Plan upgrade required", { code: "PLAN_REQUIRED" });
      }

      const storeId = String(qValue.merchantId);
      const storeInfo = await getPublicStoreInfo(storeId);
      const domain =
        (storeInfo && storeInfo.domain ? String(storeInfo.domain).trim() : "") || (merchant && merchant.storeDomain ? String(merchant.storeDomain).trim() : "");
      const storeUrlHost =
        (storeInfo && storeInfo.url ? pickHostFromUrlLike(storeInfo.url) : "") || (merchant && merchant.storeUrl ? pickHostFromUrlLike(merchant.storeUrl) : "");
      const originHost = pickHostFromUrlLike(req.headers.origin);
      const refererHost = pickHostFromUrlLike(req.headers.referer);
      const h = originHost || refererHost;
      const allowedHosts = buildAllowedHosts({ domainHost: domain, urlHost: storeUrlHost });
      const allowedHostOk = Boolean(h) && allowedHosts.some((a) => hostEquals(h, a));
      if (!allowedHostOk) throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });

      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      if (!body.length) throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });

      const limits = getPlanLimits(planKey);
      if (body.length > limits.maxFileBytes) {
        throw new ApiError(403, "File size limit exceeded", { code: "FILE_SIZE_LIMIT_EXCEEDED", details: { maxBytes: limits.maxFileBytes } });
      }

      const maxInputPixels = planKey === "business" ? 70_000_000 : 45_000_000;
      const base = sharp(body, { sequentialRead: true, failOn: "none", limitInputPixels: maxInputPixels });
      const meta = await base.metadata().catch(() => ({}));

      const srcW = Number(meta && meta.width) || 0;
      const srcH = Number(meta && meta.height) || 0;
      const srcPixels = srcW > 0 && srcH > 0 ? srcW * srcH : 0;

      let targetFormat = String(qValue.format || "keep").trim().toLowerCase();
      if (targetFormat === "keep") {
        const srcFmtRaw = String(meta && meta.format ? meta.format : "").trim().toLowerCase();
        const srcFmt = srcFmtRaw === "jpg" ? "jpeg" : srcFmtRaw;
        if (srcFmt === "jpeg" || srcFmt === "png" || srcFmt === "webp" || srcFmt === "avif") {
          targetFormat = srcFmt;
        } else {
          targetFormat = "";
        }
      }
      if (!targetFormat) targetFormat = srcPixels && srcPixels >= 14_000_000 ? "webp" : "avif";

      const speed = String(qValue.speed || "fast").trim().toLowerCase();
      const effort = speed === "small" ? 6 : speed === "balanced" ? 4 : 2;

      const qRaw = qValue.quality != null ? Number(qValue.quality) : null;
      const quality =
        qRaw && Number.isFinite(qRaw)
          ? Math.max(1, Math.min(100, Math.round(qRaw)))
          : targetFormat === "avif"
            ? speed === "small"
              ? 50
              : 55
            : speed === "small"
              ? 76
              : 82;

      let img = base.rotate();
      const presetKey = String(qValue.preset || "").trim().toLowerCase();
      const preset =
        presetKey === "square"
          ? { width: 1080, height: 1080 }
          : presetKey === "story"
            ? { width: 1080, height: 1920 }
            : presetKey === "banner"
              ? { width: 1920, height: 1080 }
              : presetKey === "thumb"
                ? { width: 512, height: 512 }
                : null;
      const presetDims = !preset && presetKey && /^\d{1,4}x\d{1,4}$/.test(presetKey)
        ? (() => {
            const parts = presetKey.split("x");
            const w = Math.max(1, Math.min(6000, Math.round(Number(parts[0] || 0) || 0)));
            const h = Math.max(1, Math.min(6000, Math.round(Number(parts[1] || 0) || 0)));
            return w && h ? { width: w, height: h } : null;
          })()
        : null;

      const wReqRaw = qValue.width != null ? Number(qValue.width) : null;
      const hReqRaw = qValue.height != null ? Number(qValue.height) : null;
      const wReq = wReqRaw && Number.isFinite(wReqRaw) ? Math.max(1, Math.min(6000, Math.round(wReqRaw))) : null;
      const hReq = hReqRaw && Number.isFinite(hReqRaw) ? Math.max(1, Math.min(6000, Math.round(hReqRaw))) : null;

      const targetW = preset ? preset.width : presetDims ? presetDims.width : wReq;
      const targetH = preset ? preset.height : presetDims ? presetDims.height : hReq;

      const resizeMode = String(qValue.mode || "fit").trim().toLowerCase();
      const position = String(qValue.position || "center").trim().toLowerCase();
      const wantResize = Boolean(targetW || targetH) && presetKey !== "original";

      if (wantResize) {
        const fit = resizeMode === "cover" && targetW && targetH ? "cover" : "inside";
        const pos = position === "attention" ? "attention" : position === "entropy" ? "entropy" : "center";
        img = img.resize({
          width: targetW || undefined,
          height: targetH || undefined,
          fit,
          position: fit === "cover" ? pos : undefined,
          withoutEnlargement: true
        });
      } else {
        const targetPixels = planKey === "business" ? 18_000_000 : 12_000_000;
        if (srcPixels && srcPixels > targetPixels && srcW > 0 && srcH > 0) {
          const scale = Math.sqrt(targetPixels / srcPixels);
          const w = Math.max(1, Math.floor(srcW * scale));
          const hh = Math.max(1, Math.floor(srcH * scale));
          img = img.resize({ width: w, height: hh, fit: "inside", withoutEnlargement: true });
        }
      }

      let out = null;
      let contentType = "application/octet-stream";
      let ext = "bin";

      if (targetFormat === "webp") {
        out = await img.webp({ quality, effort, smartSubsample: true }).toBuffer();
        contentType = "image/webp";
        ext = "webp";
      } else if (targetFormat === "avif") {
        out = await img.avif({ quality, effort }).toBuffer();
        contentType = "image/avif";
        ext = "avif";
      } else if (targetFormat === "jpeg") {
        out = await img.jpeg({ quality, mozjpeg: true }).toBuffer();
        contentType = "image/jpeg";
        ext = "jpeg";
      } else if (targetFormat === "png") {
        const compressionLevel = speed === "small" ? 9 : speed === "balanced" ? 7 : 6;
        out = await img.png({ compressionLevel, adaptiveFiltering: true, palette: speed === "small", quality }).toBuffer();
        contentType = "image/png";
        ext = "png";
      } else {
        throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });
      }

      const headerName = String(req.headers["x-file-name"] || "").trim();
      const baseNameRaw = String(qValue.name || headerName || "converted").trim();
      let baseName = "";
      for (let i = 0; i < baseNameRaw.length; i += 1) {
        const ch = baseNameRaw[i];
        const code = ch.charCodeAt(0);
        if (code < 32) continue;
        if (ch === '"') continue;
        if (ch === "/" || ch === "\\") {
          baseName += "_";
          continue;
        }
        baseName += ch;
      }
      baseName = baseName.replace(/\s+/g, " ").trim().slice(0, 120);
      let baseNoExt = baseName;
      const dot = baseNoExt.lastIndexOf(".");
      if (dot > 0) baseNoExt = baseNoExt.slice(0, dot);
      const fileName = (baseNoExt || "converted") + "." + ext;

      res.status(200);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("X-Converted-Format", ext);
      return res.send(out);
    } catch (err) {
      return next(err);
    }
  });

  const proxyToolsConvertVideoQuerySchema = Joi.object({
    merchantId: Joi.string().trim().min(1).max(80).required(),
    token: Joi.string().trim().min(10),
    signature: Joi.string().trim().min(8),
    hmac: Joi.string().trim().min(8),
    format: Joi.string().trim().valid("mp4", "webm").default("mp4"),
    quality: Joi.number().integer().min(1).max(100),
    speed: Joi.string().trim().valid("fast", "balanced", "small").default("fast"),
    name: Joi.string().trim().min(1).max(180).allow("")
  })
    .or("signature", "hmac", "token")
    .unknown(true);

  router.post("/proxy/tools/convert-video", express.raw({ type: () => true, limit: "60mb" }), async (req, res, next) => {
    try {
      const { error: qErr, value: qValue } = proxyToolsConvertVideoQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: false });
      if (qErr) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: qErr.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      ensureValidProxyAuth(qValue, qValue.merchantId);

      const merchant = await findMerchantByMerchantId(String(qValue.merchantId));
      if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });
      if (merchant.appStatus !== "installed") throw new ApiError(403, "Merchant is not active", { code: "MERCHANT_INACTIVE" });

      const planKey = getPlanKey(merchant);
      if (planKey !== "pro" && planKey !== "business") {
        throw new ApiError(403, "Plan upgrade required", { code: "PLAN_REQUIRED" });
      }

      const storeId = String(qValue.merchantId);
      const storeInfo = await getPublicStoreInfo(storeId);
      const domain =
        (storeInfo && storeInfo.domain ? String(storeInfo.domain).trim() : "") || (merchant && merchant.storeDomain ? String(merchant.storeDomain).trim() : "");
      const storeUrlHost =
        (storeInfo && storeInfo.url ? pickHostFromUrlLike(storeInfo.url) : "") || (merchant && merchant.storeUrl ? pickHostFromUrlLike(merchant.storeUrl) : "");
      const originHost = pickHostFromUrlLike(req.headers.origin);
      const refererHost = pickHostFromUrlLike(req.headers.referer);
      const h = originHost || refererHost;
      const allowedHosts = buildAllowedHosts({ domainHost: domain, urlHost: storeUrlHost });
      const allowedHostOk = Boolean(h) && allowedHosts.some((a) => hostEquals(h, a));
      if (!allowedHostOk) throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });

      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      if (!body.length) throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });

      const limits = getPlanLimits(planKey);
      if (body.length > limits.maxFileBytes) {
        throw new ApiError(403, "File size limit exceeded", { code: "FILE_SIZE_LIMIT_EXCEEDED", details: { maxBytes: limits.maxFileBytes } });
      }

      const speed = String(qValue.speed || "fast").trim().toLowerCase();
      const preset = speed === "small" ? "slow" : speed === "balanced" ? "medium" : "veryfast";
      const qRaw = qValue.quality != null ? Number(qValue.quality) : null;
      const quality = qRaw && Number.isFinite(qRaw) ? Math.max(1, Math.min(100, Math.round(qRaw))) : speed === "small" ? 70 : 78;

      const baseCrf = 33 - Math.round(((quality - 1) * 15) / 99);
      const crf = Math.max(18, Math.min(33, baseCrf));

      const targetFormat = String(qValue.format || "mp4").trim().toLowerCase();
      const headerName = String(req.headers["x-file-name"] || "").trim();
      const baseNameRaw = String(qValue.name || headerName || "converted").trim();
      let baseName = "";
      for (let i = 0; i < baseNameRaw.length; i += 1) {
        const ch = baseNameRaw[i];
        const code = ch.charCodeAt(0);
        if (code < 32) continue;
        if (ch === '"') continue;
        if (ch === "/" || ch === "\\") {
          baseName += "_";
          continue;
        }
        baseName += ch;
      }
      baseName = baseName.replace(/\s+/g, " ").trim().slice(0, 120);
      let baseNoExt = baseName;
      const dot = baseNoExt.lastIndexOf(".");
      if (dot > 0) baseNoExt = baseNoExt.slice(0, dot);

      let ext = "mp4";
      let contentType = "video/mp4";
      let args = [];
      if (targetFormat === "webm") {
        ext = "webm";
        contentType = "video/webm";
        const cpuUsed = speed === "small" ? "2" : speed === "balanced" ? "4" : "6";
        const vp9Crf = Math.max(18, Math.min(45, Math.round(crf + 6)));
        args = [
          "-hide_banner",
          "-loglevel",
          "error",
          "-i",
          "pipe:0",
          "-map_metadata",
          "-1",
          "-c:v",
          "libvpx-vp9",
          "-b:v",
          "0",
          "-crf",
          String(vp9Crf),
          "-row-mt",
          "1",
          "-cpu-used",
          String(cpuUsed),
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "libopus",
          "-b:a",
          speed === "small" ? "96k" : "128k",
          "-f",
          "webm",
          "pipe:1"
        ];
      } else {
        args = [
          "-hide_banner",
          "-loglevel",
          "error",
          "-i",
          "pipe:0",
          "-map_metadata",
          "-1",
          "-movflags",
          "frag_keyframe+empty_moov",
          "-pix_fmt",
          "yuv420p",
          "-c:v",
          "libx264",
          "-preset",
          String(preset),
          "-crf",
          String(crf),
          "-c:a",
          "aac",
          "-b:a",
          speed === "small" ? "96k" : "128k",
          "-ac",
          "2",
          "-ar",
          "48000",
          "-f",
          "mp4",
          "pipe:1"
        ];
      }

      const fileName = (baseNoExt || "converted") + "." + ext;

      let stderr = "";
      const proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
      proc.on("spawn", () => {
        try {
          res.status(200);
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
          res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
          res.setHeader("X-Converted-Format", ext);
          proc.stdout.pipe(res);
        } catch (e) {
          void e;
        }
      });
      proc.on("error", (e) => {
        if (String(e && e.code) === "ENOENT") return next(new ApiError(501, "Video convert is not supported on this server", { code: "NOT_SUPPORTED" }));
        return next(new ApiError(502, "Bad gateway", { code: "BAD_GATEWAY", details: { message: String(e?.message || e) } }));
      });
      proc.stderr.on("data", (d) => {
        try {
          if (stderr.length > 4000) return;
          stderr += String(d || "");
        } catch (e) {
          void e;
        }
      });
      res.on("close", () => {
        try {
          if (!proc.killed) proc.kill("SIGKILL");
        } catch (e) {
          void e;
        }
      });
      proc.on("close", (code) => {
        const c = Number(code || 0) || 0;
        if (c === 0) return;
        try {
          if (!res.headersSent) return next(new ApiError(400, "Convert failed", { code: "CONVERT_FAILED", details: { message: stderr.trim().slice(0, 1200) } }));
          try {
            res.destroy();
          } catch (e) {
            void e;
          }
        } catch (e) {
          void e;
          try {
            res.destroy();
          } catch (e2) {
            void e2;
          }
        }
      });

      try {
        proc.stdin.end(body);
      } catch (e) {
        try {
          if (!res.headersSent) return next(new ApiError(400, "Convert failed", { code: "CONVERT_FAILED", details: { message: String(e?.message || e) } }));
        } catch (e2) {
          void e2;
        }
        try {
          res.destroy();
        } catch (e2) {
          void e2;
        }
      }
      return;
    } catch (err) {
      return next(err);
    }
  });

  router.delete("/proxy/media/assets/:id", async (req, res, next) => {
    try {
      const { error: qErr, value: qValue } = Joi.object({
        merchantId: Joi.string().trim().min(1).max(80).required(),
        token: Joi.string().trim().min(10),
        signature: Joi.string().trim().min(8),
        hmac: Joi.string().trim().min(8)
      })
        .or("signature", "hmac", "token")
        .unknown(true)
        .validate(req.query, { abortEarly: false, stripUnknown: false });
      if (qErr) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: qErr.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      const { error: pErr, value: pValue } = Joi.object({ id: Joi.string().trim().min(10).required() }).validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });
      if (pErr) {
        throw new ApiError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: pErr.details.map((d) => ({ message: d.message, path: d.path }))
        });
      }

      ensureValidProxyAuth(qValue, qValue.merchantId);

      const merchant = await findMerchantByMerchantId(String(qValue.merchantId));
      if (!merchant) throw new ApiError(404, "Merchant not found", { code: "MERCHANT_NOT_FOUND" });
      if (merchant.appStatus !== "installed") throw new ApiError(403, "Merchant is not active", { code: "MERCHANT_INACTIVE" });

      const storeId = String(qValue.merchantId);
      const asset = await MediaAsset.findOne({ _id: String(pValue.id), storeId, deletedAt: null });
      if (!asset) throw new ApiError(404, "Not found", { code: "NOT_FOUND" });

      const expectedPrefix = `${getMediaFolderPrefix().replace(/\/+$/g, "")}/${storeId}/`;
      if (!String(asset.publicId || "").startsWith(expectedPrefix)) {
        throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
      }

      try {
        const provider = String(asset?.cloudinary?.__provider || asset?.cloudinary?.provider || "").trim().toLowerCase();
        if (provider !== "r2") throw new ApiError(400, "Unsupported media provider", { code: "UNSUPPORTED_MEDIA_PROVIDER" });
        await r2DeleteObject(String(asset.publicId));
      } catch (e) {
        const msg = String(e?.response?.data?.error?.message || e?.message || e);
        throw new ApiError(502, "Bad gateway", { code: "BAD_GATEWAY", details: { message: msg } });
      }

      asset.deletedAt = new Date();
      await asset.save();

      mediaPolicyCache.delete(`used:${storeId}`);

      for (const key of publicCache.keys()) {
        if (String(key || "").startsWith("public:media:")) publicCache.delete(key);
      }

      return res.json({ ok: true });
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

      const merchantId = String(qValue.merchantId);
      const provider = getMediaProviderOrThrow();
      const folderPrefix = getMediaFolderPrefix();
      const folder = mediaFolderForMerchant(folderPrefix, merchantId);

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

      if (provider === "r2") {
        const rawCt = String(bValue?.file?.type || "").trim();
        const contentType = rawCt && /^[\w.+-]+\/[\w.+-]+$/.test(rawCt) ? rawCt : "application/octet-stream";
        const key = `${String(folder).replace(/\/+$/g, "")}/${publicId}`;
        const uploadUrl = await r2PresignPut({ key, contentType });
        return res.json({
          ok: true,
          cloudinary: {
            provider: "r2",
            uploadMethod: "PUT",
            resourceType: policy.resourceType,
            uploadUrl,
            folder,
            publicId,
            key,
            contentType,
            ...(contextStr ? { context: contextStr } : {}),
            ...(tagsStr ? { tags: tagsStr } : {})
          }
        });
      }
      throw new ApiError(500, "Media provider is not supported", { code: "MEDIA_PROVIDER_NOT_SUPPORTED" });
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
      const provider = String(c.__provider || c.provider || "").trim().toLowerCase();
      const isR2 = provider === "r2";
      const r2Key = isR2 ? String(c.r2_key || c.key || c.public_id || "").trim() : "";
      if (!isR2) throw new ApiError(400, "Unsupported media provider", { code: "UNSUPPORTED_MEDIA_PROVIDER" });
      const destroyUploaded = async () => {
        if (!r2Key) return;
        await r2DeleteObject(r2Key);
      };

      const planKey = getPlanKey(merchant);
      const limits = getPlanLimits(planKey);
      const allowed = getAllowedExtForPlan(planKey);
      let fileExt = normalizeFilenameExt(c.original_filename);
      if (!fileExt) {
        const fmt = String(c.format || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
        if (fmt) fileExt = fmt;
      }
      if (fileExt && bannedExt.has(fileExt)) {
        await destroyUploaded().catch(() => undefined);
        throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
      }
      if (allowed && fileExt && !allowed.has(fileExt)) {
        await destroyUploaded().catch(() => undefined);
        throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
      }
      if ((planKey !== "pro" && planKey !== "business") && String(c.format || "").toLowerCase() === "svg") {
        await destroyUploaded().catch(() => undefined);
        throw new ApiError(403, "File type is not allowed", { code: "FILE_TYPE_NOT_ALLOWED" });
      }

      const expectedPrefix = `${getMediaFolderPrefix().replace(/\/+$/g, "")}/${storeId}/`;
      if (!r2Key) throw new ApiError(400, "Validation error", { code: "VALIDATION_ERROR" });
      if (!r2Key.startsWith(expectedPrefix)) {
        await destroyUploaded().catch(() => undefined);
        throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
      }
      let head = null;
      try {
        head = await r2HeadObject(r2Key);
      } catch (e) {
        await destroyUploaded().catch(() => undefined);
        throw new ApiError(404, "Not found", { code: "NOT_FOUND", details: { message: String(e?.message || e) } });
      }
      const actualBytes = Number(head?.ContentLength || 0) || 0;
      c.bytes = actualBytes || c.bytes;
      c.public_id = r2Key;
      if (!c.folder) c.folder = r2Key.includes("/") ? r2Key.split("/").slice(0, -1).join("/") : "";

      const prev = await MediaAsset.findOne({ storeId, publicId: String(c.public_id), deletedAt: null }).lean();
      const used = await getStoreUsedBytesCached(storeId);
      const prevBytes = Number(prev?.bytes || 0) || 0;
      const nextBytes = Number(c.bytes || 0) || 0;
      if (nextBytes > limits.maxFileBytes) {
        await destroyUploaded().catch(() => undefined);
        throw new ApiError(403, "File size limit exceeded", { code: "FILE_SIZE_LIMIT_EXCEEDED", details: { maxBytes: limits.maxFileBytes } });
      }
      if (used - prevBytes + nextBytes > limits.maxStorageBytes) {
        await destroyUploaded().catch(() => undefined);
        throw new ApiError(403, "Storage limit exceeded", {
          code: "STORAGE_LIMIT_EXCEEDED",
          details: { maxBytes: limits.maxStorageBytes, usedBytes: Math.max(0, used - prevBytes) }
        });
      }

      if (String(c.format || "").toLowerCase() === "svg") {
        try {
          await ensureSvgSafeR2OrThrow(r2Key);
        } catch (e) {
          await destroyUploaded().catch(() => undefined);
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
          },
          $setOnInsert: {
            shortCode: randomShortCode(12)
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (doc && !doc.shortCode) {
        for (let i = 0; i < 4; i += 1) {
          const sc = randomShortCode(12);
          try {
            const r = await MediaAsset.updateOne(
              { _id: doc._id, deletedAt: null, $or: [{ shortCode: null }, { shortCode: { $exists: false } }] },
              { $set: { shortCode: sc } }
            );
            if (r && (r.modifiedCount || r.nModified)) {
              doc.shortCode = sc;
              break;
            }
          } catch (e) {
            void e;
          }
        }
      }

      const rt = String(c.resource_type || "").trim().toLowerCase();
      if (process.env.NODE_ENV !== "test" && planKey === "basic" && (rt === "image" || rt === "video")) {
        await sleep(10_000);
      }

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
