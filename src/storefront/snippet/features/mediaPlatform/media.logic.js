const uiPartsRaw = require("./media.ui");
const uiParts = Array.isArray(uiPartsRaw) ? uiPartsRaw : [];

module.exports = [
  `(function(){\n`,
  `const g = (() => { try { return globalThis; } catch { return window; } })() || window;\n`,
  `g.BundleApp = g.BundleApp || {};\n`,
  `const MODE = (() => {\n  try {\n    const m = String((g && g.__APP_MODE__) || "").trim();\n    if (m) return m;\n  } catch {}\n  try {\n    if (String(merchantId || "").trim() === "sandbox") return "sandbox";\n  } catch {}\n  return "storefront";\n})();\n`,
  `const debug = MODE === "sandbox" ? true : (() => { try { return new URL(scriptSrc).searchParams.get("debug") === "1"; } catch { return false; } })();\n`,
  `const log = (...args) => { if (!debug) return; try { console.log(...args); } catch {} };\n`,
  `const warn = (...args) => { if (!debug) return; try { console.warn(...args); } catch {} };\n`,
  `
const isSandbox = MODE === "sandbox";
const isModal = MODE === "modal";
const isModalMount = isSandbox || isModal;
if (isSandbox) {
  try {
    merchantId = "sandbox";
  } catch {}
  try {
    token = "sandbox";
  } catch {}
}

const sandboxSelector = '.angel-cc_modal.is-open [data-view="upload"]';
const themeSlotId = "angel-cc-upload-slot";
const isThemeEditor = (() => {
  try {
    const h = String((window && window.location && window.location.hostname) || "").toLowerCase();
    return h.indexOf("s.salla.sa") !== -1 || h.indexOf("salla.design") !== -1;
  } catch {
    return false;
  }
})();

const getSandboxTarget = () => {
  try {
    return document.querySelector(sandboxSelector);
  } catch {
    return null;
  }
};

const getThemeSlotTarget = () => {
  try {
    return document.getElementById(themeSlotId);
  } catch {
    return null;
  }
};

const startSandboxObserver = (fn) => {
  try {
    if (g.BundleApp && g.BundleApp.__sandboxObserverStarted) return;
    g.BundleApp.__sandboxObserverStarted = true;
  } catch {}

  try {
    const root = document.documentElement || document.body;
    if (!root || !window.MutationObserver) return;
    const mo = new MutationObserver(() => {
      try {
        fn();
      } catch {}
    });
    try {
      g.BundleApp.__sandboxMo = mo;
    } catch {}
    mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "data-view", "style"] });
  } catch {}
};

const startThemeSlotObserver = (fn) => {
  try {
    if (g.BundleApp && g.BundleApp.__themeSlotObserverStarted) return;
    g.BundleApp.__themeSlotObserverStarted = true;
  } catch {}

  try {
    const root = document.documentElement || document.body;
    if (!root || !window.MutationObserver) return;
    const mo = new MutationObserver(() => {
      try {
        fn();
      } catch {}
    });
    try {
      g.BundleApp.__themeSlotMo = mo;
    } catch {}
    mo.observe(root, { subtree: true, childList: true, attributes: true });
  } catch {}
};

const sandboxFetchJson = async (url, opts = {}) => {
  const method = String((opts && opts.method) || "GET").toUpperCase();
  if (method !== "GET") throw new Error("Sandbox mode: API calls disabled");

  let u = null;
  try {
    u = new URL(String(url || ""), window.location.href);
  } catch {}

  const path = String((u && u.pathname) || "");
  if (path.indexOf("/api/") !== 0) throw new Error("Sandbox mode: API calls disabled");

  if (path === "/api/proxy/media/assets") {
    const rt = String((u && u.searchParams && u.searchParams.get("resourceType")) || "").trim();
    const now = new Date().toISOString();
    const svg = (label) =>
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#18b5d5"/><stop offset="1" stop-color="#0b1220"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="40" y="40" width="880" height="560" rx="28" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.25)"/><text x="80" y="140" font-family="ui-sans-serif,system-ui,Segoe UI,Arial" font-size="44" font-weight="900" fill="#ffffff">BundleApp Sandbox</text><text x="80" y="210" font-family="ui-sans-serif,system-ui,Segoe UI,Arial" font-size="28" font-weight="800" fill="rgba(255,255,255,0.92)">' +
          String(label || "") +
          '</text><text x="80" y="520" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="18" font-weight="700" fill="rgba(255,255,255,0.8)">' +
          now +
          "</text></svg>"
      );

    if (rt === "video") return { ok: true, total: 0, items: [] };

    const items = [
      {
        id: "sandbox_1",
        merchantId: "sandbox",
        storeId: "sandbox",
        resourceType: "image",
        publicId: "sandbox/sample_1",
        assetId: "sandbox_1",
        folder: "sandbox",
        originalFilename: "sample_1.svg",
        format: "svg",
        bytes: 1320,
        width: 960,
        height: 640,
        duration: null,
        url: svg("Sample Asset #1"),
        secureUrl: svg("Sample Asset #1"),
        thumbnailUrl: svg("Sample Asset #1"),
        tags: ["sandbox"],
        context: null,
        cloudinaryCreatedAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "sandbox_2",
        merchantId: "sandbox",
        storeId: "sandbox",
        resourceType: "image",
        publicId: "sandbox/sample_2",
        assetId: "sandbox_2",
        folder: "sandbox",
        originalFilename: "sample_2.svg",
        format: "svg",
        bytes: 1450,
        width: 960,
        height: 640,
        duration: null,
        url: svg("Sample Asset #2"),
        secureUrl: svg("Sample Asset #2"),
        thumbnailUrl: svg("Sample Asset #2"),
        tags: ["sandbox"],
        context: null,
        cloudinaryCreatedAt: now,
        createdAt: now,
        updatedAt: now
      }
    ];

    return { ok: true, total: items.length, items };
  }

  throw new Error("Sandbox mode: API calls disabled");
};
`,
  `
const getBackendOrigin = () => {
  try {
    return new URL(scriptSrc).origin;
  } catch {
    return "";
  }
};
`,
  `
const buildUrl = (path, params = {}) => {
  const origin = getBackendOrigin();
  if (!origin) return null;
  const u = new URL(origin + path);
  for (const [k, v] of Object.entries(params || {})) {
    if (v == null || String(v) === "") continue;
    u.searchParams.set(String(k), String(v));
  }
  u.searchParams.set("merchantId", merchantId);
  u.searchParams.set("token", token);
  return u.toString();
};
`,
  `
const fetchJson = async (url, opts = {}) => {
  if (isSandbox) return await sandboxFetchJson(url, opts);
  const r = await fetch(url, opts || {});
  const t = await r.text();
  let j = null;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {
    throw new Error("Invalid JSON response");
  }
  if (!r.ok) {
    const msg = (j && j.message) || \`HTTP \${r.status}\`;
    const err = new Error(msg);
    err.status = r.status;
    err.details = j;
    throw err;
  }
  return j;
};
`,
  `
const postJson = (url, body) =>
  fetchJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
`,
  `
const deleteJson = (url) => fetchJson(url, { method: "DELETE" });
`,
  `
const pageLang = () => {
  try {
    const el = document && document.documentElement;
    const b = document && document.body;
    const l = (el && el.getAttribute && el.getAttribute("lang")) || (b && b.getAttribute && b.getAttribute("lang")) || "";
    return String(l || "").toLowerCase();
  } catch {
    return "";
  }
};
`,
  `
const isArabic = () => {
  try {
    const l = pageLang();
    if (l && l.indexOf("ar") === 0) return true;
    const nl = String((navigator && navigator.language) || "").toLowerCase();
    return Boolean(nl && nl.indexOf("ar") === 0);
  } catch {
    return false;
  }
};
`,
  `
const friendlyApiErrorMessage = (err) => {
  const fallback = String((err && err.message) || err || "").trim();
  const payload = err && err.details && typeof err.details === "object" ? err.details : null;
  const code = String((payload && payload.code) || (err && err.code) || "").trim();
  const details = payload && payload.details && typeof payload.details === "object" ? payload.details : null;

  if (code === "PLAN_REQUIRED") return isArabic() ? "هذه الميزة متاحة في Pro و Business فقط" : "This feature is available in Pro and Business only";

  if (code === "UNSUPPORTED_MEDIA") return isArabic() ? "الملف غير مدعوم" : "Unsupported media";

  if (code === "FILE_TYPE_NOT_ALLOWED") return isArabic() ? "نوع الملف غير مدعوم" : "Unsupported file type";

  if (code === "FILE_SIZE_LIMIT_EXCEEDED") {
    const maxBytes = Number(details && details.maxBytes) || 0;
    const maxText = maxBytes ? (isArabic() ? " (الحد " + fmtBytes(maxBytes) + ")" : " (max " + fmtBytes(maxBytes) + ")") : "";
    return (isArabic() ? "حجم الملف أكبر من المسموح في خطتك" : "File is too large for your plan") + maxText;
  }

  if (code === "STORAGE_LIMIT_EXCEEDED") {
    const maxBytes = Number(details && details.maxBytes) || 0;
    const usedBytes = Number(details && details.usedBytes) || 0;
    const maxText = maxBytes ? (isArabic() ? " (" + fmtBytes(usedBytes) + " / " + fmtBytes(maxBytes) + ")" : " (" + fmtBytes(usedBytes) + " / " + fmtBytes(maxBytes) + ")") : "";
    return (isArabic() ? "تم تجاوز حد التخزين في خطتك" : "Storage limit exceeded for your plan") + maxText;
  }

  if (code === "SVG_INVALID") return isArabic() ? "SVG غير صالح أو غير آمن" : "Invalid or unsafe SVG";

  if (code === "VALIDATION_ERROR") return isArabic() ? "بيانات غير صحيحة" : "Validation error";
  if (code === "UNAUTHORIZED") return isArabic() ? "غير مصرح" : "Unauthorized";
  if (code === "FORBIDDEN") return isArabic() ? "غير مسموح" : "Forbidden";
  if (code === "NOT_FOUND") return isArabic() ? "غير موجود" : "Not found";
  if (code === "MEDIA_STORAGE_NOT_CONFIGURED") return isArabic() ? "التخزين غير مُعد" : "Media storage is not configured";

  if (fallback) return fallback;
  if (payload && payload.message) return String(payload.message);
  return isArabic() ? "حدث خطأ" : "Something went wrong";
};
`,
  `
const isRtl = () => {
  try {
    const d = (document && document.documentElement && document.documentElement.dir) || "";
    if (d && String(d).toLowerCase() === "rtl") return true;
    const bd = (document && document.body && document.body.dir) || "";
    if (bd && String(bd).toLowerCase() === "rtl") return true;
    const cs = window.getComputedStyle ? window.getComputedStyle(document.body || document.documentElement) : null;
    const dir = cs && cs.direction ? String(cs.direction).toLowerCase() : "";
    if (dir === "rtl") return true;
    return isArabic();
  } catch {
    return false;
  }
};
`,
  `
const ensureOnce = () => {
  try {
    if (g.BundleApp && g.BundleApp.__mediaPlatformMounted) return false;
    g.BundleApp.__mediaPlatformMounted = true;
    return true;
  } catch {
    return true;
  }
};
`,
  ...uiParts,
  `
const ensureMediaApiCache = () => {
  try {
    if (!g.__bundleAppMediaApiCache) g.__bundleAppMediaApiCache = new Map();
    if (!g.__bundleAppMediaApiInFlight) g.__bundleAppMediaApiInFlight = new Map();
  } catch {}
};

const mediaApiPeek = (url, ttlMs) => {
  const u = String(url || "");
  const ttl = Math.max(0, Number(ttlMs || 0) || 0);
  if (!u) return null;
  ensureMediaApiCache();
  const cache = g.__bundleAppMediaApiCache;
  if (!cache || !cache.get) return null;
  const rec = cache.get(u);
  if (!rec || typeof rec !== "object") return null;
  const at = Number(rec.at || 0) || 0;
  if (ttl && at && Date.now() - at > ttl) return null;
  return "data" in rec ? rec.data : null;
};

const mediaApiGet = async (url, ttlMs, force) => {
  const u = String(url || "");
  if (!u) throw new Error("Missing url");
  ensureMediaApiCache();

  if (!force) {
    const hit = mediaApiPeek(u, ttlMs);
    if (hit !== null) return hit;
  }

  const inFlight = g.__bundleAppMediaApiInFlight;
  try {
    if (inFlight && inFlight.has && inFlight.has(u)) return await inFlight.get(u);
  } catch {}

  const p = (async () => {
    const j = await fetchJson(u);
    try {
      const cache = g.__bundleAppMediaApiCache;
      if (cache && cache.set) cache.set(u, { at: Date.now(), data: j });
    } catch {}
    return j;
  })();

  try {
    if (inFlight && inFlight.set) inFlight.set(u, p);
  } catch {}

  try {
    return await p;
  } finally {
    try {
      if (inFlight && inFlight.delete) inFlight.delete(u);
    } catch {}
  }
};

const clearMediaApiCache = () => {
  try {
    if (g.__bundleAppMediaApiCache && g.__bundleAppMediaApiCache.clear) g.__bundleAppMediaApiCache.clear();
  } catch {}
  try {
    if (g.__bundleAppMediaApiInFlight && g.__bundleAppMediaApiInFlight.clear) g.__bundleAppMediaApiInFlight.clear();
  } catch {}
};

const DASH_TTL_MS = 60 * 1000;
const ASSETS_TTL_MS = 60 * 1000;
`,
  `
const loadAssets = async (resourceType, page, limit, force) => {
  const url = buildUrl("/api/proxy/media/assets", { resourceType: resourceType || "", page: page || 1, limit: limit || 24 });
  if (!url) throw new Error("Missing backend origin");
  return await mediaApiGet(url, ASSETS_TTL_MS, Boolean(force));
};
`,
  `
const loadDashboard = async (force) => {
  const url = buildUrl("/api/proxy/media/dashboard", {});
  if (!url) throw new Error("Missing backend origin");
  return await mediaApiGet(url, DASH_TTL_MS, Boolean(force));
};
`,
  `
const getSignature = async (resourceType, file) => {
  const url = buildUrl("/api/proxy/media/signature", {});
  if (!url) throw new Error("Missing backend origin");
  const rt = String(resourceType || "image");
  return await postJson(url, {
    resourceType: rt,
    file: {
      name: String((file && file.name) || ""),
      size: Number((file && file.size) || 0) || 0,
      type: String((file && file.type) || "")
    }
  });
};
`,
  `
const getExt = (name) => {
  const s = String(name || "").trim();
  const i = s.lastIndexOf(".");
  if (i <= 0 || i === s.length - 1) return "";
  return s.slice(i + 1).trim().toLowerCase();
};
`,
  `
const normalizeFilenameExt = (name) => {
  const s = String(name || "").trim();
  if (!s) return "";
  const lastDot = s.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === s.length - 1) return "";
  const raw = s.slice(lastDot + 1).trim().toLowerCase();
  return raw.replace(/[^a-z0-9]+/g, "");
};

const bytesFromMb = (mb) => Math.floor(Math.max(0, Number(mb || 0)) * 1024 * 1024);
const bytesFromGb = (gb) => Math.floor(Math.max(0, Number(gb || 0)) * 1024 * 1024 * 1024);

const getPlanLimits = (planKey) => {
  const k = String(planKey || "").trim().toLowerCase();
  if (k === "pro") {
    return {
      maxFileBytes: bytesFromMb(30),
      maxStorageBytes: bytesFromGb(20)
    };
  }
  if (k === "business") {
    return {
      maxFileBytes: bytesFromMb(50),
      maxStorageBytes: bytesFromGb(50)
    };
  }
  return {
    maxFileBytes: bytesFromMb(10),
    maxStorageBytes: bytesFromGb(5)
  };
};

const bannedExt = new Set(["exe", "js", "mjs", "cjs", "php", "phtml", "html", "htm", "sh", "bat", "cmd", "ps1", "jar", "com", "scr", "msi"]);

const getAllowedExtForPlan = (planKey) => {
  const k = String(planKey || "").trim().toLowerCase();
  const base = new Set(["gif", "pdf", "jpg", "jpeg", "png", "webp", "avif", "mp4", "webm"]);
  if (k === "pro") {
    const proOnly = ["css", "zip", "json", "otf", "tiff", "tif", "svg", "ttf", "woff", "woff2", "eot"];
    for (let i = 0; i < proOnly.length; i += 1) base.add(proOnly[i]);
    return base;
  }
  if (k === "business") return null;
  return base;
};

const fmtExtSet = (set, maxItems) => {
  try {
    if (!set || !set.size) return "";
    const arr = Array.from(set.values()).sort();
    const max = Math.max(0, Number(maxItems || 0) || 0) || 18;
    const head = arr.slice(0, max);
    const tail = arr.length > head.length ? (isArabic() ? " …" : " …") : "";
    return head.join(", ") + tail;
  } catch {
    return "";
  }
};

const acceptForUploadPlan = (planKey) => {
  const k = String(planKey || "").trim().toLowerCase();
  if (k === "business") return "*/*";
  if (k === "pro") return "image/*,video/*,application/pdf,.zip,.json,.svg,.css,.woff,.woff2,.ttf,.otf,.eot";
  return "image/*,video/mp4,video/webm,application/pdf";
};

const buildAllowedFormatsPopover = (planKey) => {
  try {
    const k = String(planKey || "").trim().toLowerCase() || "basic";
    const planName = planLabel(k);
    const allowed = getAllowedExtForPlan(k);

    const title = isArabic()
      ? ("الصيغ المتاحة في باقة " + planName)
      : ("Allowed formats on " + planName);

    if (!allowed) {
      const blocked = (() => {
        try {
          const arr = Array.from(bannedExt.values()).map((x) => String(x || "").trim().toUpperCase()).filter(Boolean).sort();
          const head = arr.slice(0, 10);
          const tail = arr.length > head.length ? " …" : "";
          return head.join(", ") + tail;
        } catch {
          return "";
        }
      })();

      return {
        title,
        sections: [{ label: isArabic() ? "كل الصيغ" : "All formats", items: [] }],
        note: blocked ? (isArabic() ? ("مع حظر أمني لبعض الصيغ مثل: " + blocked) : ("Security blocks some formats e.g.: " + blocked)) : ""
      };
    }

    const groups = { images: [], videos: [], docs: [], web: [], fonts: [], other: [] };
    const toList = (a) => Array.from(new Set(a)).map((x) => String(x || "").trim().toUpperCase()).filter(Boolean).sort();

    for (const ext0 of allowed.values()) {
      const ext = String(ext0 || "").trim().toLowerCase();
      if (!ext) continue;

      if (["jpg", "jpeg", "png", "gif", "webp", "avif", "tif", "tiff", "svg"].indexOf(ext) >= 0) groups.images.push(ext);
      else if (["mp4", "webm", "mpeg", "mpg"].indexOf(ext) >= 0) groups.videos.push(ext);
      else if (["pdf", "json"].indexOf(ext) >= 0) groups.docs.push(ext);
      else if (["woff", "woff2", "ttf", "otf", "eot"].indexOf(ext) >= 0) groups.fonts.push(ext);
      else if (["css"].indexOf(ext) >= 0) groups.web.push(ext);
      else groups.other.push(ext);
    }

    const sections = [];
    const pushSec = (ar, en, items) => {
      const list = toList(items);
      if (!list.length) return;
      sections.push({ label: isArabic() ? ar : en, items: list });
    };
    pushSec("صور", "Images", groups.images);
    pushSec("فيديو", "Video", groups.videos);
    pushSec("مستندات", "Documents", groups.docs);
    pushSec("خطوط", "Fonts", groups.fonts);
    pushSec("ملفات ويب", "Web files", groups.web);
    pushSec("أخرى", "Other", groups.other);

    return { title, sections, note: "" };
  } catch {
    return null;
  }
};
`,
  `
const guessResourceType = (file) => {
  const t = String((file && file.type) || "").toLowerCase();
  if (t === "video/mpeg") return "video";
  if (t.indexOf("video/") === 0) return "video";
  if (t.indexOf("image/") === 0) return "image";
  const ext = getExt(file && file.name);
  if (["mp4", "webm", "mpeg", "mpg", "mov", "avi", "m4v", "mkv"].indexOf(ext) >= 0) return "video";
  if (["jpg", "jpeg", "png", "webp", "avif", "gif", "tif", "tiff", "svg", "bmp", "heic", "heif"].indexOf(ext) >= 0) return "image";
  return "raw";
};
`,
  `
const buildDeliveryUrlFromItem = (it) => {
  try {
    const origin = getBackendOrigin();
    if (!origin) return "";
    const sc = String((it && it.shortCode) || "").trim();
    if (sc) return String(origin + "/" + encodeURIComponent(sc));
    const storeId = String((it && (it.storeId || it.merchantId)) || "").trim();
    const publicId = String((it && it.publicId) || "").trim();
    if (!storeId || !publicId) return "";
    const parts = publicId.split("/").filter(Boolean);
    const leaf = parts.length ? String(parts[parts.length - 1] || "").trim() : "";
    if (!leaf) return "";
    return String(origin + "/api/m/" + encodeURIComponent(storeId) + "/" + encodeURIComponent(leaf));
  } catch {
    return "";
  }
};
`,
  `
const recordAsset = async (cloud) => {
  const url = buildUrl("/api/proxy/media/assets", {});
  if (!url) throw new Error("Missing backend origin");
  return await postJson(url, { cloudinary: cloud });
};
`,
  `
const deleteAssetById = async (id) => {
  const assetId = String(id || "").trim();
  if (!assetId) throw new Error("Invalid asset id");
  const url = buildUrl("/api/proxy/media/assets/" + encodeURIComponent(assetId), {});
  if (!url) throw new Error("Missing backend origin");
  return await deleteJson(url);
};
`,
  `
const uploadToCloudinary = async (file, sign, onProgress) => {
  if (isSandbox) throw new Error("Sandbox mode: upload disabled");
  const c = sign && sign.cloudinary ? sign.cloudinary : null;
  if (!c || !c.uploadUrl || !c.folder || !c.publicId) throw new Error("Invalid signature");

  const fileSize = Number((file && file.size) || 0) || 0;
  const provider = String(c.provider || "").trim().toLowerCase();
  const method = String(c.uploadMethod || (provider === "r2" ? "PUT" : "POST")).trim().toUpperCase();
  const url = String(c.uploadUrl);
  if (!url) throw new Error("Invalid upload url");

  if (method === "PUT") {
    const ct = String(c.contentType || (file && file.type) || "").trim();
    const key = String(c.key || (String(c.folder || "") + "/" + String(c.publicId || ""))).trim();
    const rt = String(c.resourceType || guessResourceType(file) || "raw");

    const putViaXhr = (uploadUrl) =>
      new Promise((resolve, reject) => {
        let xhr = null;
        try {
          xhr = new XMLHttpRequest();
        } catch {
          xhr = null;
        }
        if (!xhr) {
          reject(new Error("Upload not supported"));
          return;
        }

        try {
          xhr.open("PUT", String(uploadUrl), true);
          if (ct) xhr.setRequestHeader("Content-Type", ct);
        } catch {
          reject(new Error("Upload failed"));
          return;
        }

        let lastAt = 0;
        let progressSeen = false;
        let noProgressTimer = null;

        const clearNoProgressTimer = () => {
          try {
            if (noProgressTimer) clearTimeout(noProgressTimer);
          } catch {}
          noProgressTimer = null;
        };

        const emit = (pct, loaded, total) => {
          try {
            if (typeof onProgress !== "function") return;
            const now = Date.now();
            if (pct === 100 || now - lastAt > 80) {
              lastAt = now;
              onProgress(pct, loaded, total);
            }
          } catch {}
        };

        const fail = (err) => {
          try {
            clearNoProgressTimer();
          } catch {}
          reject(err || new Error("Upload failed"));
        };

        try {
          if (xhr.upload) {
            xhr.upload.onprogress = (ev) => {
              try {
                progressSeen = true;
                clearNoProgressTimer();
              } catch {}
              try {
                const loaded = Number(ev && ev.loaded) || 0;
                const evTotal = Number(ev && ev.total) || 0;
                const denom = evTotal > 0 ? evTotal : fileSize > 0 ? fileSize : 0;
                if (denom > 0) {
                  const pct = Math.max(0, Math.min(100, Math.round((loaded / denom) * 100)));
                  emit(pct, loaded, denom);
                  return;
                }
                emit(0, loaded, evTotal);
              } catch {}
            };
            try {
              xhr.upload.onloadstart = () => {
                emit(0, 0, fileSize);
              };
            } catch {}
          }
        } catch {}

        xhr.onerror = () => fail(new Error("Upload failed"));
        xhr.onabort = () => fail(new Error("Upload aborted"));
        xhr.onload = () => {
          try {
            clearNoProgressTimer();
          } catch {}
          try {
            emit(100, fileSize, fileSize);
          } catch {}

          const status = Number(xhr.status || 0) || 0;
          if (status < 200 || status >= 300) {
            fail(new Error("Upload failed"));
            return;
          }
          resolve(true);
        };

        try {
          noProgressTimer = setTimeout(() => {
            try {
              if (progressSeen) return;
              xhr.abort();
            } catch {}
          }, 12_000);
        } catch {}

        try {
          xhr.send(file);
        } catch {
          fail(new Error("Upload failed"));
        }
      });

    try {
      await putViaXhr(url);
    } catch (e) {
      const fallbackUrl = buildUrl("/api/proxy/media/upload", {
        key,
        resourceType: rt,
        filename: String((file && file.name) || "file"),
        contentType: ct
      });
      if (!fallbackUrl) throw e;
      await putViaXhr(fallbackUrl);
    }

    const ext = getExt(file && file.name);
    return {
      __provider: "r2",
      r2_key: key,
      public_id: key,
      asset_id: null,
      resource_type: rt,
      secure_url: null,
      url: null,
      bytes: fileSize || null,
      format: ext || null,
      width: null,
      height: null,
      duration: null,
      original_filename: String((file && file.name) || "") || null,
      folder: String(c.folder || "") || null,
      tags: [],
      context: null,
      created_at: new Date().toISOString()
    };
  }

  const fd = new FormData();
  fd.append("file", file);
  if (!c.apiKey || !c.signature || !c.timestamp) throw new Error("Invalid signature");
  fd.append("api_key", String(c.apiKey));
  fd.append("timestamp", String(c.timestamp));
  fd.append("signature", String(c.signature));
  fd.append("folder", String(c.folder));
  fd.append("public_id", String(c.publicId));
  if (c.tags) fd.append("tags", String(c.tags));
  if (c.context) fd.append("context", String(c.context));

  return await new Promise((resolve, reject) => {
    let xhr = null;
    try {
      xhr = new XMLHttpRequest();
    } catch {
      xhr = null;
    }
    if (!xhr) {
      reject(new Error("Upload not supported"));
      return;
    }

    try {
      xhr.open("POST", url, true);
      try {
        xhr.responseType = "json";
      } catch {}
    } catch {
      reject(new Error("Upload failed"));
      return;
    }

    let lastAt = 0;
    const emit = (pct, loaded, total) => {
      try {
        if (typeof onProgress !== "function") return;
        const now = Date.now();
        if (pct === 100 || now - lastAt > 80) {
          lastAt = now;
          onProgress(pct, loaded, total);
        }
      } catch {}
    };

    try {
      if (xhr.upload) {
        xhr.upload.onprogress = (ev) => {
          try {
            const loaded = Number(ev && ev.loaded) || 0;
            const evTotal = Number(ev && ev.total) || 0;
            const denom = evTotal > 0 ? evTotal : fileSize > 0 ? fileSize : 0;
            if (denom > 0) {
              const pct = Math.max(0, Math.min(100, Math.round((loaded / denom) * 100)));
              emit(pct, loaded, denom);
              return;
            }
            emit(0, loaded, evTotal);
          } catch {}
        };
        try {
          xhr.upload.onloadstart = () => {
            emit(0, 0, fileSize);
          };
        } catch {}
      }
    } catch {}

    xhr.onerror = () => {
      reject(new Error("Upload failed"));
    };
    xhr.onabort = () => {
      reject(new Error("Upload aborted"));
    };
    xhr.onload = () => {
      try {
        emit(100, fileSize, fileSize);
      } catch {}

      const status = Number(xhr.status || 0) || 0;
      let body = null;
      try {
        body = xhr.response;
      } catch {
        body = null;
      }
      if (!body) {
        try {
          const t = String(xhr.responseText || "");
          body = t ? JSON.parse(t) : null;
        } catch {
          body = null;
        }
      }
      if (status < 200 || status >= 300) {
        const msg = (body && body.error && body.error.message) || "Upload failed";
        reject(new Error(msg));
        return;
      }
      resolve(body);
    };

    try {
      xhr.send(fd);
    } catch {
      reject(new Error("Upload failed"));
    }
  });
};
`,
  `
const mount = () => {
  try {
    let mountRoot = null;
    const themeTarget = getThemeSlotTarget();
    const shouldWaitForThemeSlot = (() => {
      try {
        if (themeTarget) return false;
        if (isModalMount) return false;
        if (!g || !g.BundleApp) return false;
        if (g.BundleApp.__themeSlotWaitExpired) return false;
        const rs = String((document && document.readyState) || "");
        return isThemeEditor || rs !== "complete";
      } catch {
        return false;
      }
    })();

    if (shouldWaitForThemeSlot) {
      startThemeSlotObserver(mount);
      try {
        if (!g.BundleApp.__themeSlotWaitTimer) {
          g.BundleApp.__themeSlotWaitTimer = setTimeout(() => {
            try {
              g.BundleApp.__themeSlotWaitExpired = true;
            } catch {}
            try {
              mount();
            } catch {}
          }, 1200);
        }
      } catch {}
      return;
    }

    if (themeTarget) {
      mountRoot = themeTarget;
      if (mountRoot.__mounted) return;
    } else if (isModalMount) {
      mountRoot = getSandboxTarget();
      if (!mountRoot) {
        startSandboxObserver(mount);
        return;
      }
      if (mountRoot.__mounted) return;
    } else {
      mountRoot = document.body;
    }

    if (!ensureOnce()) return;
    try {
      if (typeof ensureStyles === "function") ensureStyles();
    } catch {}

    const isInlineMount = isModalMount || !!themeTarget;
    const fab = isInlineMount
      ? (() => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.setAttribute("aria-label", isArabic() ? "ملاك ابلودر" : "Malak Uploader");
          btn.style.width = "100%";
          btn.style.minHeight = "44px";
          btn.style.border = "1px solid rgba(24,181,213,.35)";
          btn.style.cursor = "pointer";
          btn.style.borderRadius = "14px";
          btn.style.background = "#292929";
          btn.style.color = "#fff";
          btn.style.boxShadow = "0 16px 44px rgba(0,0,0,.22)";
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.gap = "10px";
          btn.style.userSelect = "none";
          btn.style.webkitUserSelect = "none";
          btn.style.fontWeight = "950";
          btn.style.fontSize = "13px";
          btn.style.padding = "12px 14px";
          btn.style.transition = "transform .14s ease, filter .14s ease";
          btn.onmouseenter = () => {
            try {
              btn.style.filter = "brightness(1.05)";
            } catch {}
          };
          btn.onmouseleave = () => {
            try {
              btn.style.filter = "";
            } catch {}
          };
          btn.onmousedown = () => {
            try {
              btn.style.transform = "translateY(1px)";
            } catch {}
          };
          btn.onmouseup = () => {
            try {
              btn.style.transform = "";
            } catch {}
          };

          const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          icon.setAttribute("viewBox", "0 0 24 24");
          icon.setAttribute("aria-hidden", "true");
          icon.setAttribute("width", "20");
          icon.setAttribute("height", "20");
          icon.style.display = "block";
          icon.style.color = "#18b5d5";

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("fill", "currentColor");
          path.setAttribute(
            "d",
            "M12 2l3.09 6.26 6.91 1.01-5 4.87 1.18 6.88L12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z"
          );
          icon.appendChild(path);

          const label = document.createElement("span");
          label.textContent = isArabic() ? "فتح ملاك ابلودر" : "Open Malak Uploader";
          label.style.lineHeight = "1";

          btn.appendChild(icon);
          btn.appendChild(label);

          return btn;
        })()
      : createFab();
    try {
      setFabVisible(fab, true);
    } catch {}

    let sheetEl = null;
    fab.onclick = () => {
      try {
        if (sheetEl) return;

        const sheet = buildSheet();
        sheetEl = sheet.overlay;

        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = "*/*";
        input.style.display = "none";
        document.body.appendChild(input);

        const convertInput = document.createElement("input");
        convertInput.type = "file";
        convertInput.multiple = true;
        convertInput.accept = "image/*,video/mp4,video/webm";
        convertInput.style.display = "none";
        document.body.appendChild(convertInput);

        const compressInput = document.createElement("input");
        compressInput.type = "file";
        compressInput.multiple = true;
        compressInput.accept = "image/*";
        compressInput.style.display = "none";
        document.body.appendChild(compressInput);

        let convertObjUrl = "";

        const close = () => {
          try {
            const keys = Array.from(toastMap.keys());
            for (let i = 0; i < keys.length; i += 1) toastClose(keys[i]);
          } catch {}
          try {
            if (toastHost && toastHost.remove) toastHost.remove();
          } catch {}
          toastHost = null;
          try {
            if (convertObjUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(convertObjUrl);
          } catch {}
          try {
            if (typeof revokeConvertObjectUrls === "function") revokeConvertObjectUrls();
          } catch {}
          try {
            if (typeof revokeMediaObjectUrls === "function") revokeMediaObjectUrls();
          } catch {}
          try {
            if (typeof revokeCompressObjectUrls === "function") revokeCompressObjectUrls();
          } catch {}
          try {
            if (sheetEl) sheetEl.remove();
          } catch {}
          try {
            if (input && input.remove) input.remove();
          } catch {}
          try {
            if (convertInput && convertInput.remove) convertInput.remove();
          } catch {}
          try {
            if (compressInput && compressInput.remove) compressInput.remove();
          } catch {}
          sheetEl = null;
        };

        sheet.closeBtn.onclick = close;
        sheet.overlay.addEventListener("click", (ev) => {
          try {
            if (ev.target === sheet.overlay) close();
          } catch {}
        });

        const state = {
          view: "upload",
          type: "",
          page: 1,
          limit: 12,
          loading: false,
          items: [],
          total: 0,
          error: "",
          dashLoading: false,
          dashError: "",
          dash: null,
          uploads: [],
          uploading: false,
          uploadError: "",
          deletingId: "",
          convertKind: "image",
          convertFile: null,
          convertFiles: [],
          convertFormat: "keep",
          convertSpeed: "fast",
          convertQuality: "",
          convertPreset: "",
          convertWidth: "",
          convertHeight: "",
          convertMode: "fit",
          convertPosition: "center",
          converting: false,
          convertProgress: 0,
          convertOverallProgress: 0,
          convertError: "",
          convertResultUrl: "",
          convertResultBytes: 0,
          convertResultFormat: "",
          convertUploading: false,
          convertUploadProgress: 0,
          convertUploadLoaded: 0,
          convertUploadTotal: 0,
          convertUploadError: "",
          convertUploadUrl: "",
          convertUploadPublicId: "",
          convertItems: [],
          compressFiles: [],
          compressFormat: "keep",
          compressQuality: "",
          compressRunning: false,
          compressOverallProgress: 0,
          compressError: "",
          compressItems: [],
          compressUploadingAny: false,
          compressUploadingAll: false,
          compressDownloadingAll: false
        };

        let toastSeq = 0;
        const toastMap = new Map();
        let swalLoadPromise = null;
        let swalLoadResult = undefined;
        let swalStyleDone = false;

        const getSwalTarget = () => {
          try {
            const panel = sheet && sheet.overlay && sheet.overlay.querySelector ? sheet.overlay.querySelector(".bundle-app-bottomsheet__panel") : null;
            const t = panel || (sheet && sheet.overlay) || document.body;
            try {
              if (t && t.classList) t.classList.add("bundleapp-swal-target");
            } catch {}
            return t;
          } catch {
            return document.body;
          }
        };

        const ensureSwalStyles = () => {
          if (swalStyleDone) return;
          swalStyleDone = true;
          try {
            const style = document.createElement("style");
            style.type = "text/css";
            style.textContent =
              ".bundleapp-swal-target{position:relative}" +
              ".bundleapp-swal-container{position:absolute!important;left:0!important;right:0!important;top:10px!important;bottom:auto!important;pointer-events:none!important;padding:0 12px!important;display:flex!important;justify-content:center!important;align-items:flex-start!important}" +
              ".bundleapp-swal-container .swal2-popup{pointer-events:auto!important}" +
              ".bundleapp-swal-toast{background:#373737!important;color:#fff!important;border:1px solid rgba(24,181,213,.18)!important;border-radius:14px!important;box-shadow:0 12px 40px rgba(0,0,0,.35)!important;font-weight:400!important}" +
              ".bundleapp-swal-toast .swal2-title{color:#fff!important;font-size:12px!important;font-weight:700!important;margin:0!important}" +
              ".bundleapp-swal-toast .swal2-icon.swal2-success{border-color:#22c55e!important;color:#22c55e!important}" +
              ".bundleapp-swal-toast .swal2-icon.swal2-warning{border-color:#facc15!important;color:#facc15!important}" +
              ".bundleapp-swal-toast .swal2-icon.swal2-error{border-color:#ef4444!important;color:#ef4444!important}" +
              ".bundleapp-swal-toast .swal2-success [class^='swal2-success-line']{background-color:#22c55e!important}" +
              ".bundleapp-swal-toast .swal2-success .swal2-success-ring{border-color:rgba(34,197,94,.35)!important}" +
              ".bundleapp-swal-toast .swal2-error [class^='swal2-x-mark-line']{background-color:#ef4444!important}" +
              ".bundleapp-swal-popup{background:#303030!important;color:#fff!important;border:1px solid rgba(24,181,213,.18)!important;border-radius:16px!important}" +
              ".bundleapp-swal-popup .swal2-title{color:#fff!important;font-weight:700!important}" +
              ".bundleapp-swal-popup .swal2-html-container{color:rgba(255,255,255,.85)!important;font-weight:400!important}" +
              ".bundleapp-swal-confirm{background:#ef4444!important;color:#fff!important;border:0!important;border-radius:12px!important;padding:10px 12px!important;font-weight:700!important}" +
              ".bundleapp-swal-cancel{background:#373737!important;color:#fff!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:12px!important;padding:10px 12px!important;font-weight:700!important}" +
              ".bundleapp-swal-ok{background:#18b5d5!important;color:#303030!important;border:0!important;border-radius:12px!important;padding:10px 12px!important;font-weight:700!important}" +
              ".bundleapp-toast-host{position:absolute;left:0;right:0;top:10px;z-index:100000;pointer-events:none;padding:0 12px;display:flex;justify-content:center;align-items:flex-start}" +
              ".bundleapp-toast{pointer-events:auto;min-width:min(460px,100%);max-width:min(640px,100%);background:#373737;color:#fff;border:1px solid rgba(24,181,213,.18);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:10px 12px;display:flex;gap:10px;align-items:flex-start;font-weight:400;opacity:0;transform:translateY(-6px);transition:opacity .16s ease,transform .16s ease}" +
              ".bundleapp-toast.is-in{opacity:1;transform:translateY(0)}" +
              ".bundleapp-toast__icon{width:18px;height:18px;flex:0 0 18px;margin-top:1px;display:flex;align-items:center;justify-content:center;color:#fff}" +
              ".bundleapp-toast__spinner{width:14px;height:14px;border-radius:999px;border:2px solid rgba(255,255,255,.25);border-top-color:#18b5d5;animation:bundleappSpin .75s linear infinite}" +
              ".bundleapp-toast__body{flex:1 1 auto;min-width:0}" +
              ".bundleapp-toast__title{font-size:12px;font-weight:700;line-height:1.35;margin:0}" +
              ".bundleapp-toast__msg{font-size:12px;font-weight:400;line-height:1.5;margin-top:2px;color:rgba(255,255,255,.88);word-break:break-word}" +
              ".bundleapp-toast__close{appearance:none;border:1px solid rgba(255,255,255,.12);background:transparent;color:#fff;border-radius:10px;padding:4px 8px;cursor:pointer;font-weight:400;line-height:1}" +
              ".bundleapp-toast.is-success{border-color:rgba(34,197,94,.35)}" +
              ".bundleapp-toast.is-error{border-color:rgba(239,68,68,.35)}" +
              ".bundleapp-toast.is-warning{border-color:rgba(234,179,8,.35)}" +
              ".bundleapp-toast.is-info{border-color:rgba(59,130,246,.35)}" +
              ".bundleapp-toast.is-success .bundleapp-toast__icon{color:#22c55e}" +
              ".bundleapp-toast.is-warning .bundleapp-toast__icon{color:#facc15}" +
              ".bundleapp-toast.is-error .bundleapp-toast__icon{color:#ef4444}" +
              ".bundleapp-toast.is-info .bundleapp-toast__icon{color:#38bdf8}" +
              ".bundle-app-bottomsheet,.bundle-app-bottomsheet *{font-weight:400!important}" +
              ".bundle-app-bottomsheet__title,.bundle-app-bottomsheet h1,.bundle-app-bottomsheet h2,.bundle-app-bottomsheet h3,.bundle-app-bottomsheet h4,.bundle-app-bottomsheet strong,.bundleapp-tab{font-weight:700!important}" +
              "@keyframes bundleappSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
            document.head.appendChild(style);
          } catch {}
        };

        let refreshSpinStyleDone = false;
        const ensureRefreshSpinStyles = () => {
          if (refreshSpinStyleDone) return;
          refreshSpinStyleDone = true;
          try {
            const style = document.createElement("style");
            style.type = "text/css";
            style.textContent = "@keyframes bundleapp-rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
            document.head.appendChild(style);
          } catch {}
        };

        const ensureSwal = async () => {
          try {
            if (g.Swal && typeof g.Swal.fire === "function") {
              ensureSwalStyles();
              return g.Swal;
            }
          } catch {}

          if (swalLoadResult !== undefined) return swalLoadResult;

          if (!swalLoadPromise) {
            swalLoadPromise = (async () => {
              const sources = [
                "https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.26.17/sweetalert2.all.min.js",
                "https://unpkg.com/sweetalert2@11/dist/sweetalert2.all.min.js",
                "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"
              ];

              const tryLoad = async (src) => {
                return await new Promise((resolve) => {
                  let done = false;
                  let timer = null;
                  let s = null;
                  const finish = (val) => {
                    if (done) return;
                    done = true;
                    try {
                      if (timer) clearTimeout(timer);
                    } catch {}
                    timer = null;
                    try {
                      if (s && s.remove) s.remove();
                    } catch {}
                    s = null;
                    resolve(val);
                  };

                  try {
                    s = document.createElement("script");
                    s.async = true;
                    s.defer = true;
                    s.setAttribute("data-bundleapp-swal", "1");
                    s.src = String(src);
                    s.onload = () => finish(g.Swal && typeof g.Swal.fire === "function" ? g.Swal : null);
                    s.onerror = () => finish(null);
                    document.head.appendChild(s);
                    timer = setTimeout(() => finish(null), 2500);
                  } catch {
                    finish(null);
                  }
                });
              };

              for (const src of sources) {
                const hit = await tryLoad(src);
                if (hit) return hit;
              }
              return null;
            })();
          }

          swalLoadResult = await swalLoadPromise;
          try {
            if (swalLoadResult) ensureSwalStyles();
          } catch {}
          return swalLoadResult;
        };

        const ensureLocalToastHost = () => {
          try {
            const target = getSwalTarget();
            ensureSwalStyles();
            if (!target || !target.querySelector) return null;
            let host = target.querySelector(".bundleapp-toast-host");
            if (!host) {
              host = document.createElement("div");
              host.className = "bundleapp-toast-host";
              target.appendChild(host);
            }
            return host;
          } catch {
            return null;
          }
        };

        const fireToast = async ({ id, kind, title, message, duration, loading }) => {
          const Swal = await ensureSwal();
          const target = getSwalTarget();
          const t = String(title || "").trim();
          const msg = String(message || "").trim();
          const icon = kind === "success" || kind === "error" || kind === "warning" || kind === "info" ? kind : "info";

          if (Swal) {
            await Swal.fire({
              target,
              toast: true,
              position: "top",
              icon: loading ? undefined : icon,
              title: t || msg,
              ...(t && msg ? { text: msg } : {}),
              showConfirmButton: false,
              showCloseButton: true,
              timer: duration || undefined,
              timerProgressBar: Boolean(duration),
              customClass: {
                container: "bundleapp-swal-container",
                popup: "bundleapp-swal-toast"
              },
              didOpen: (el) => {
                try {
                  el.dir = isRtl() ? "rtl" : "ltr";
                } catch {}
                try {
                  el.addEventListener("mouseenter", Swal.stopTimer);
                  el.addEventListener("mouseleave", Swal.resumeTimer);
                } catch {}
                try {
                  if (loading) Swal.showLoading();
                } catch {}
              }
            });
            return;
          }

          const host = ensureLocalToastHost();
          if (!host) return;

          const toast = document.createElement("div");
          toast.className = "bundleapp-toast is-" + icon;

          const iconEl = document.createElement("div");
          iconEl.className = "bundleapp-toast__icon";
          if (loading) {
            const sp = document.createElement("div");
            sp.className = "bundleapp-toast__spinner";
            iconEl.appendChild(sp);
          } else {
            iconEl.textContent = icon === "success" ? "✓" : icon === "error" ? "×" : icon === "warning" ? "!" : "i";
          }

          const body = document.createElement("div");
          body.className = "bundleapp-toast__body";
          const ttl = document.createElement("div");
          ttl.className = "bundleapp-toast__title";
          ttl.textContent = t || msg || "";
          body.appendChild(ttl);
          if (t && msg) {
            const mm = document.createElement("div");
            mm.className = "bundleapp-toast__msg";
            mm.textContent = msg;
            body.appendChild(mm);
          }

          const close = document.createElement("button");
          close.type = "button";
          close.className = "bundleapp-toast__close";
          close.textContent = "×";

          toast.appendChild(iconEl);
          toast.appendChild(body);
          toast.appendChild(close);
          host.innerHTML = "";
          host.appendChild(toast);

          try {
            toast.dir = isRtl() ? "rtl" : "ltr";
          } catch {}

          let timer = null;
          const cleanup = () => {
            try {
              if (timer) clearTimeout(timer);
            } catch {}
            timer = null;
            try {
              if (toast && toast.remove) toast.remove();
            } catch {}
          };

          close.addEventListener("click", () => {
            cleanup();
            if (id) toastMap.delete(String(id));
          });

          requestAnimationFrame(() => {
            try {
              toast.classList.add("is-in");
            } catch {}
          });

          if (duration) {
            timer = setTimeout(cleanup, Math.max(600, Number(duration) || 0));
          }

          if (id) {
            toastMap.set(String(id), {
              kind: "loading",
              local: {
                update: (nextTitle, nextMsg) => {
                  try {
                    ttl.textContent = nextTitle || nextMsg || "";
                  } catch {}
                  try {
                    const existingMsg = body.querySelector(".bundleapp-toast__msg");
                    if (existingMsg) {
                      if (nextTitle && nextMsg) existingMsg.textContent = nextMsg;
                      else existingMsg.remove();
                    } else if (nextTitle && nextMsg) {
                      const mm = document.createElement("div");
                      mm.className = "bundleapp-toast__msg";
                      mm.textContent = nextMsg;
                      body.appendChild(mm);
                    }
                  } catch {}
                },
                close: cleanup
              }
            });
          }
        };

        const toastClose = (id) => {
          const key = String(id || "");
          if (!toastMap.has(key)) return;
          const entry = toastMap.get(key);
          toastMap.delete(key);
          try {
            if (entry && entry.local && typeof entry.local.close === "function") {
              entry.local.close();
              return;
            }
          } catch {}
          ensureSwal().then((Swal) => {
            try {
              if (Swal) Swal.close();
            } catch {}
          });
        };

        const toastUpdate = (id, next) => {
          const key = String(id || "");
          if (!toastMap.has(key)) return;
          const title = next && "title" in next ? String(next.title || "").trim() : "";
          const message = next && "message" in next ? String(next.message || "").trim() : "";
          const entry = toastMap.get(key);
          try {
            if (entry && entry.local && typeof entry.local.update === "function") {
              entry.local.update(title, message);
              return;
            }
          } catch {}
          ensureSwal().then((Swal) => {
            try {
              if (!Swal) return;
              Swal.update({
                title: title || message,
                ...(title && message ? { text: message } : {})
              });
            } catch {}
          });
        };

        const toastSuccess = (message, title) => fireToast({ kind: "success", title: title || (isArabic() ? "تم" : "Done"), message: String(message || ""), duration: 2500 });
        const toastInfo = (message, title) => fireToast({ kind: "info", title: title || (isArabic() ? "تنبيه" : "Info"), message: String(message || ""), duration: 2500 });
        const toastWarn = (message, title) => fireToast({ kind: "warning", title: title || (isArabic() ? "تنبيه" : "Warning"), message: String(message || ""), duration: 4000 });
        const toastError = (message, title) => fireToast({ kind: "error", title: title || (isArabic() ? "خطأ" : "Error"), message: String(message || ""), duration: 5000 });
        const toastLoading = (message, title) => {
          const id = "swal_" + String((toastSeq += 1));
          toastMap.set(id, { kind: "loading" });
          fireToast({ id, kind: "info", title: title || (isArabic() ? "جاري التنفيذ" : "Working"), message: String(message || ""), loading: true });
          return id;
        };

        const refreshDashboard = async (force) => {
          if (state.dashLoading) return;
          try {
            if (!force) {
              const url = buildUrl("/api/proxy/media/dashboard", {});
              const hit = url ? mediaApiPeek(url, DASH_TTL_MS) : null;
              if (hit) {
                state.dash = hit && typeof hit === "object" ? hit : null;
                state.dashLoading = false;
                state.dashError = "";
                render();
                return;
              }
            }
          } catch {}
          state.dashLoading = true;
          state.dashError = "";
          render();
          try {
            const d = await loadDashboard(force);
            state.dash = d && typeof d === "object" ? d : null;
            state.dashLoading = false;
            render();
          } catch (e) {
            state.dashLoading = false;
            state.dashError = friendlyApiErrorMessage(e);
            render();
            toastError(state.dashError);
          }
        };

        const confirmMini = async (title, message) => {
          return await new Promise((resolve) => {
            let overlay = null;
            let panel = null;
            const done = (val) => {
              try {
                if (overlay && overlay.remove) overlay.remove();
              } catch {}
              overlay = null;
              panel = null;
              resolve(Boolean(val));
            };

            try {
              overlay = document.createElement("div");
              overlay.style.position = "fixed";
              overlay.style.inset = "0";
              overlay.style.zIndex = "100006";
              overlay.style.display = "flex";
              overlay.style.alignItems = "center";
              overlay.style.justifyContent = "center";
              overlay.style.padding = "14px";
              overlay.style.background = "rgba(0,0,0,.55)";
              overlay.onclick = (ev) => {
                try {
                  if (ev.target === overlay) done(false);
                } catch {}
              };

              panel = document.createElement("div");
              panel.style.width = "min(340px,100%)";
              panel.style.borderRadius = "16px";
              panel.style.border = "1px solid rgba(255,255,255,.14)";
              panel.style.background = "#373737";
              panel.style.padding = "12px";
              panel.style.display = "flex";
              panel.style.flexDirection = "column";
              panel.style.gap = "10px";
              panel.onclick = (e) => {
                try {
                  e.stopPropagation();
                } catch {}
              };

              const h = document.createElement("div");
              h.style.fontSize = "13px";
              h.style.fontWeight = "950";
              h.style.color = "#fff";
              h.textContent = String(title || "");

              const b = document.createElement("div");
              b.style.fontSize = "12px";
              b.style.fontWeight = "850";
              b.style.color = "rgba(255,255,255,.82)";
              b.style.lineHeight = "1.4";
              b.textContent = String(message || "");

              const row = document.createElement("div");
              row.style.display = "flex";
              row.style.gap = "10px";
              row.style.justifyContent = "flex-end";
              row.style.alignItems = "center";

              const cancel = document.createElement("button");
              cancel.type = "button";
              cancel.textContent = isArabic() ? "إلغاء" : "Cancel";
              cancel.style.border = "1px solid rgba(255,255,255,.12)";
              cancel.style.background = "rgba(255,255,255,.06)";
              cancel.style.color = "#fff";
              cancel.style.padding = "10px 12px";
              cancel.style.borderRadius = "12px";
              cancel.style.fontSize = "12px";
              cancel.style.fontWeight = "950";
              cancel.style.cursor = "pointer";
              cancel.onclick = () => done(false);

              const ok = document.createElement("button");
              ok.type = "button";
              ok.textContent = isArabic() ? "حذف" : "Delete";
              ok.style.border = "1px solid rgba(239,68,68,.35)";
              ok.style.background = "rgba(239,68,68,.18)";
              ok.style.color = "#fecaca";
              ok.style.padding = "10px 12px";
              ok.style.borderRadius = "12px";
              ok.style.fontSize = "12px";
              ok.style.fontWeight = "950";
              ok.style.cursor = "pointer";
              ok.onclick = () => done(true);

              row.appendChild(cancel);
              row.appendChild(ok);

              if (title) panel.appendChild(h);
              if (message) panel.appendChild(b);
              panel.appendChild(row);
              overlay.appendChild(panel);

              document.body.appendChild(overlay);

              try {
                ok.focus();
              } catch {}
            } catch {
              done(false);
            }

            try {
              const onKey = (ev) => {
                try {
                  const k = String(ev && ev.key) || "";
                  if (k === "Escape") done(false);
                } catch {}
              };
              window.addEventListener("keydown", onKey, { passive: true, once: true });
            } catch {}
          });
        };

        const onDeleteItem = async (it) => {
          const id = String((it && it.id) || "").trim();
          if (!id) return;
          if (state.deletingId) return;
          try {
            const name = String((it && (it.originalFilename || it.publicId)) || "").trim();
            const title = isArabic() ? "تأكيد الحذف" : "Confirm delete";
            const msg = isArabic()
              ? "هل أنت متأكد من حذف الملف" + (name ? ": " + name : "") + "؟ سيتم مسحه نهائيًا."
              : "Are you sure you want to delete this file" + (name ? ": " + name : "") + "? This will remove it permanently.";
            const ok = await confirmMini(title, msg);
            if (!ok) return;
          } catch {
            return;
          }

          state.deletingId = id;
          state.error = "";
          render();
          const toastId = toastLoading(isArabic() ? "جاري حذف الملف..." : "Deleting file...");
          try {
            await deleteAssetById(id);
            try {
              clearMediaApiCache();
            } catch {}
            state.deletingId = "";
            render();
            toastClose(toastId);
            toastSuccess(isArabic() ? "تم حذف الملف" : "File deleted");
            try {
              refreshDashboard(true);
            } catch {}
            fetchAndRender(true);
          } catch (e) {
            state.deletingId = "";
            const msg = friendlyApiErrorMessage(e);
            state.error = msg;
            render();
            toastClose(toastId);
            toastError(msg);
          }
        };

        const blobToText = async (blob) => {
          const b = blob || null;
          if (!b) return "";
          try {
            if (typeof b.text === "function") return await b.text();
          } catch {}
          return await new Promise((resolve) => {
            try {
              const r = new FileReader();
              r.onerror = () => resolve("");
              r.onload = () => resolve(String(r.result || ""));
              r.readAsText(b);
            } catch {
              resolve("");
            }
          });
        };

        const pickBestRecorderMime = (format) => {
          const f = String(format || "webm").trim().toLowerCase();
          try {
            if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
          } catch {
            return "";
          }
          let candidates = [];
          if (f === "mp4") {
            candidates = [
              "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
              "video/mp4;codecs=avc1,mp4a.40.2",
              "video/mp4;codecs=avc1",
              "video/mp4"
            ];
          } else if (f === "webm_local") {
            candidates = [
              "video/webm;codecs=vp8,opus",
              "video/webm;codecs=vp8",
              "video/webm;codecs=vp9,opus",
              "video/webm;codecs=vp9",
              "video/webm"
            ];
          } else {
            candidates = [
              "video/webm;codecs=vp9,opus",
              "video/webm;codecs=vp9",
              "video/webm;codecs=vp8,opus",
              "video/webm;codecs=vp8",
              "video/webm"
            ];
          }
          for (let i = 0; i < candidates.length; i += 1) {
            const t = candidates[i];
            try {
              if (MediaRecorder.isTypeSupported(t)) return t;
            } catch {}
          }
          return "";
        };

        const calcBitrates = (speed, quality, w, h) => {
          const s = String(speed || "fast").toLowerCase();
          const q = quality != null && Number.isFinite(quality) ? Math.max(1, Math.min(100, Math.round(Number(quality)))) : null;
          const px = (Number(w || 0) || 0) * (Number(h || 0) || 0);

          const base =
            px >= 7_500_000
              ? 6_000_000
              : px >= 3_000_000
                ? 4_000_000
                : px >= 1_000_000
                  ? 2_500_000
                  : 1_600_000;

          const speedFactor = s === "small" ? 0.55 : s === "balanced" ? 0.75 : 1.0;
          const qualityFactor = q == null ? 1.0 : 0.30 + (q / 100) * 1.40;

          const videoBitsPerSecond = Math.max(350_000, Math.round(base * speedFactor * qualityFactor));
          const audioBitsPerSecond = s === "small" ? 48_000 : s === "balanced" ? 80_000 : 96_000;
          return { videoBitsPerSecond, audioBitsPerSecond };
        };

        const loadScriptOnce = (src, key) => {
          const s = String(src || "").trim();
          const k = String(key || "").trim() || s;
          if (!s) return Promise.reject(new Error("Missing src"));
          try {
            if (!window.__bundleAppScriptOnce) window.__bundleAppScriptOnce = new Map();
          } catch {}
          try {
            const m = window.__bundleAppScriptOnce;
            if (m && m.get) {
              const hit = m.get(k);
              if (hit) return hit;
            }
          } catch {}
          const p = new Promise((resolve, reject) => {
            try {
              const esc = (() => {
                try {
                  if (window.CSS && typeof CSS.escape === "function") return CSS.escape(k);
                } catch {}
                return String(k || "").replace(/"/g, '\\"');
              })();
              const existing = document.querySelector('script[data-bundleapp="' + esc + '"]');
              if (existing) {
                existing.addEventListener("load", () => resolve(true), { once: true });
                existing.addEventListener("error", () => reject(new Error("Script load failed")), { once: true });
                return;
              }
            } catch {}
            let el = null;
            try {
              el = document.createElement("script");
              el.src = s;
              el.async = true;
              el.crossOrigin = "anonymous";
              try {
                el.dataset.bundleapp = k;
              } catch {}
              el.onload = () => resolve(true);
              el.onerror = () => reject(new Error("Script load failed"));
              document.head.appendChild(el);
            } catch (e) {
              reject(e);
            }
          });
          try {
            const m = window.__bundleAppScriptOnce;
            if (m && m.set) m.set(k, p);
          } catch {}
          return p;
        };

        const getFfmpegWasm = async () => {
          try {
            if (window.__bundleAppFfmpegWasmPromise) return await window.__bundleAppFfmpegWasmPromise;
          } catch {}
          const p = (async () => {
            await loadScriptOnce("https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/ffmpeg.min.js", "ffmpeg@0.12.10");
            const mod = (typeof window !== "undefined" && window.FFmpeg) ? window.FFmpeg : null;
            const createFFmpeg = mod && typeof mod.createFFmpeg === "function" ? mod.createFFmpeg : null;
            if (!createFFmpeg) throw new Error("FFmpeg wasm not available");
            const ffmpeg = createFFmpeg({
              log: false,
              corePath: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/ffmpeg-core.js"
            });
            try {
              await ffmpeg.load();
            } catch (e) {
              throw new Error(String((e && e.message) || e || "FFmpeg wasm load failed"));
            }
            return ffmpeg;
          })();
          try {
            window.__bundleAppFfmpegWasmPromise = p;
          } catch {}
          return await p;
        };

        const convertVideoToMpegOnClient = async (file, opts, onProgress) => {
          const f = file || null;
          if (!f) throw new Error("Missing file");
          try {
            if (typeof onProgress === "function") onProgress(1);
          } catch {}

          const ffmpeg = await getFfmpegWasm();
          const sp = String((opts && opts.speed) || "fast").trim().toLowerCase();
          const qRaw = opts && opts.quality != null ? Number(opts.quality) : null;
          const quality = qRaw && Number.isFinite(qRaw) ? Math.max(1, Math.min(100, Math.round(qRaw))) : sp === "small" ? 70 : 78;
          const qv = 31 - Math.round(((quality - 1) * 29) / 99);
          const qScale = Math.max(2, Math.min(31, qv));

          try {
            ffmpeg.setProgress(({ ratio }) => {
              try {
                if (typeof onProgress !== "function") return;
                const r = Number(ratio || 0) || 0;
                const pct = Math.max(0, Math.min(99, Math.round(r * 99)));
                onProgress(pct);
              } catch {}
            });
          } catch {}

          const mod = (typeof window !== "undefined" && window.FFmpeg) ? window.FFmpeg : null;
          const fetchFile = mod && typeof mod.fetchFile === "function" ? mod.fetchFile : null;
          if (!fetchFile) throw new Error("FFmpeg wasm not available");

          const inNameRaw = String((f && f.name) || "input").trim();
          const safeIn = inNameRaw.replace(/[^A-Za-z0-9_.()+ -]+/g, "_").slice(0, 80) || "input";
          const inName = "in_" + safeIn;
          const outName = "out.mpeg";

          try {
            ffmpeg.FS("writeFile", inName, await fetchFile(f));
            await ffmpeg.run(
              "-hide_banner",
              "-loglevel",
              "error",
              "-i",
              inName,
              "-map_metadata",
              "-1",
              "-pix_fmt",
              "yuv420p",
              "-c:v",
              "mpeg2video",
              "-q:v",
              String(qScale),
              "-c:a",
              "mp2",
              "-b:a",
              sp === "small" ? "96k" : "128k",
              "-f",
              "mpeg",
              outName
            );
            const data = ffmpeg.FS("readFile", outName);
            const out = new Blob([data && data.buffer ? data.buffer : data], { type: "video/mpeg" });
            if (!out || !out.size) throw new Error("Empty response");
            try {
              if (typeof onProgress === "function") onProgress(100);
            } catch {}
            return { blob: out, format: "mpeg" };
          } finally {
            try {
              ffmpeg.FS("unlink", inName);
            } catch {}
            try {
              ffmpeg.FS("unlink", outName);
            } catch {}
          }
        };

        const convertVideoOnClient = async (file, opts, onProgress) => {
          const f = file || null;
          if (!f) throw new Error("Missing file");
          const format = String((opts && opts.format) || "webm").trim().toLowerCase();
          if (format !== "webm" && format !== "webm_local" && format !== "mp4") throw new Error("Unsupported format");

          let srcUrl = "";
          let video = null;
          let raf = 0;
          let recorder = null;
          let stream = null;
          let baseStream = null;
          let audioCtx = null;
          let audioSrc = null;
          let audioDest = null;
          const chunks = [];

          const cleanup = () => {
            try {
              if (raf) cancelAnimationFrame(raf);
            } catch {}
            raf = 0;
            try {
              if (recorder && recorder.state !== "inactive") recorder.stop();
            } catch {}
            recorder = null;
            try {
              if (stream) {
                const tracks = stream.getTracks ? stream.getTracks() : [];
                for (let i = 0; i < tracks.length; i += 1) {
                  try {
                    tracks[i].stop();
                  } catch {}
                }
              }
            } catch {}
            stream = null;
            baseStream = null;
            try {
              if (audioSrc && audioSrc.disconnect) audioSrc.disconnect();
            } catch {}
            audioSrc = null;
            try {
              if (audioDest && audioDest.disconnect) audioDest.disconnect();
            } catch {}
            audioDest = null;
            try {
              if (audioCtx && audioCtx.close) audioCtx.close();
            } catch {}
            audioCtx = null;
            try {
              if (video && video.pause) video.pause();
            } catch {}
            try {
              if (video && video.remove) video.remove();
            } catch {}
            video = null;
            try {
              if (srcUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(srcUrl);
            } catch {}
            srcUrl = "";
          };

          try {
            const mimeType = pickBestRecorderMime(format);
            if (!mimeType) {
              if (format === "mp4") throw new Error("MP4 local conversion is not supported in this browser");
              throw new Error("MediaRecorder not supported");
            }

            srcUrl = URL.createObjectURL(f);
            video = document.createElement("video");
            video.muted = true;
            video.playsInline = true;
            video.preload = "metadata";
            video.src = srcUrl;
            video.style.position = "fixed";
            video.style.left = "-99999px";
            video.style.top = "0";
            video.style.width = "1px";
            video.style.height = "1px";
            document.body.appendChild(video);

            await new Promise((resolve, reject) => {
              const onOk = () => resolve(true);
              const onErr = () => reject(new Error("Unsupported video format"));
              try {
                video.onloadedmetadata = onOk;
                video.onerror = onErr;
                setTimeout(() => reject(new Error("Unsupported video format")), 15_000);
              } catch {
                reject(new Error("Unsupported video format"));
              }
            });

            const duration = Number(video.duration || 0) || 0;
            if (!duration || !Number.isFinite(duration)) throw new Error("Unsupported video");

            const sp = String((opts && opts.speed) || "fast").trim().toLowerCase();
            try {
              video.defaultPlaybackRate = 1;
              video.playbackRate = 1;
            } catch {}
            try {
              video.currentTime = 0;
            } catch {}

            const cap = video.captureStream ? video.captureStream.bind(video) : video.mozCaptureStream ? video.mozCaptureStream.bind(video) : null;
            if (!cap) throw new Error("captureStream not supported");
            baseStream = cap();
            if (!baseStream) throw new Error("captureStream not supported");

            try {
              const AC = window.AudioContext || window.webkitAudioContext || null;
              if (AC) {
                audioCtx = new AC();
                try {
                  if (audioCtx && audioCtx.state === "suspended" && audioCtx.resume) await audioCtx.resume();
                } catch {}
                try {
                  audioSrc = audioCtx.createMediaElementSource(video);
                  audioDest = audioCtx.createMediaStreamDestination();
                  audioSrc.connect(audioDest);
                } catch {
                  try {
                    if (audioCtx && audioCtx.close) await audioCtx.close();
                  } catch {}
                  audioCtx = null;
                  audioSrc = null;
                  audioDest = null;
                }
              }
            } catch {}

            try {
              const tracks = [];
              const vts = baseStream.getVideoTracks ? baseStream.getVideoTracks() : [];
              for (let i = 0; i < vts.length; i += 1) tracks.push(vts[i]);
              const ats =
                audioDest && audioDest.stream && audioDest.stream.getAudioTracks
                  ? audioDest.stream.getAudioTracks()
                  : baseStream.getAudioTracks
                    ? baseStream.getAudioTracks()
                    : [];
              for (let i = 0; i < ats.length; i += 1) tracks.push(ats[i]);
              stream = new MediaStream(tracks);
            } catch {
              stream = baseStream;
            }

            const q = opts && opts.quality != null ? Number(opts.quality) : null;
            const { videoBitsPerSecond, audioBitsPerSecond } = calcBitrates(sp, q, video.videoWidth, video.videoHeight);

            recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond, audioBitsPerSecond });
            recorder.ondataavailable = (ev) => {
              try {
                const d = ev && ev.data ? ev.data : null;
                if (d && d.size) chunks.push(d);
              } catch {}
            };

            const ended = new Promise((resolve) => {
              recorder.onstop = () => resolve(true);
            });

            recorder.start();

            const tick = () => {
              try {
                if (typeof onProgress === "function") {
                  const pct = Math.max(0, Math.min(99, Math.round((Number(video.currentTime || 0) / duration) * 99)));
                  onProgress(pct);
                }
              } catch {}
              raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);

            try {
              await video.play();
            } catch {
              throw new Error("Autoplay blocked");
            }

            await new Promise((resolve) => {
              video.onended = () => resolve(true);
            });

            try {
              recorder.stop();
            } catch {}
            await ended;

            const outType =
              String(mimeType || "").split(";")[0] ||
              (format === "mp4" ? "video/mp4" : "video/webm");
            const out = new Blob(chunks, { type: outType });
            if (!out || !out.size) throw new Error("Empty response");
            try {
              if (typeof onProgress === "function") onProgress(100);
            } catch {}
            const derivedFmt =
              outType.indexOf("mp4") >= 0 || outType.indexOf("quicktime") >= 0 ? "mp4" : "webm";
            return { blob: out, format: derivedFmt };
          } finally {
            cleanup();
          }
        };

        const convertOnBackend = async (file, opts, onProgress) => {
          if (isSandbox) throw new Error("Sandbox mode: convert disabled");
          const f = file || null;
          if (!f) throw new Error("Missing file");

          const rt = guessResourceType(f);
          const isVideo = rt === "video";
          const format = String((opts && opts.format) || (isVideo ? "mp4" : "keep")).trim().toLowerCase();
          const speed = String((opts && opts.speed) || "fast").trim().toLowerCase();
          const quality = (opts && opts.quality != null) ? Number(opts.quality) : null;
          const name = String((opts && opts.name) || (f && f.name) || "").trim();
          let preset = String((opts && opts.preset) || "").trim().toLowerCase();
          let width = (opts && opts.width != null) ? String(opts.width || "").trim() : "";
          let height = (opts && opts.height != null) ? String(opts.height || "").trim() : "";
          const mode = String((opts && opts.mode) || "").trim().toLowerCase();
          const position = String((opts && opts.position) || "").trim().toLowerCase();

          if (!isVideo && preset && preset !== "original") {
            const m = preset.match(/^(\\d{1,4})x(\\d{1,4})$/i);
            if (m) {
              const w = Math.max(1, Math.min(6000, Math.round(Number(m[1] || 0) || 0)));
              const h = Math.max(1, Math.min(6000, Math.round(Number(m[2] || 0) || 0)));
              if (w && h) {
                preset = "";
                width = String(w);
                height = String(h);
              }
            }
          }

          const qInt = quality != null && Number.isFinite(quality) ? Math.round(quality) : null;
          const qParam = qInt != null && qInt >= 1 && qInt <= 100 ? String(qInt) : "";

          const url = buildUrl(isVideo ? "/api/proxy/tools/convert-video" : "/api/proxy/tools/convert", {
            format,
            speed,
            quality: qParam,
            name,
            preset: isVideo ? "" : preset,
            width: isVideo ? "" : width,
            height: isVideo ? "" : height,
            mode: isVideo ? "" : mode,
            position: isVideo ? "" : position
          });
          if (!url) throw new Error("Missing backend origin");

          return await new Promise((resolve, reject) => {
            let xhr = null;
            try {
              xhr = new XMLHttpRequest();
            } catch {
              xhr = null;
            }
            if (!xhr) {
              reject(new Error("Convert not supported"));
              return;
            }

            try {
              xhr.open("POST", url, true);
              try {
                xhr.responseType = "blob";
              } catch {}
              try {
                xhr.setRequestHeader("X-File-Name", String((f && f.name) || ""));
              } catch {}
              try {
                const t = String((f && f.type) || "").trim();
                if (t) xhr.setRequestHeader("Content-Type", t);
              } catch {}
            } catch (e) {
              reject(e);
              return;
            }

            try {
              if (xhr.upload) {
                xhr.upload.onprogress = (ev) => {
                  try {
                    if (typeof onProgress !== "function") return;
                    const loaded = Number(ev && ev.loaded) || 0;
                    const total = Number(ev && ev.total) || 0;
                    if (total > 0) onProgress(Math.max(0, Math.min(70, Math.round((loaded / total) * 70))));
                    else onProgress(0);
                  } catch {}
                };
              }
            } catch {}

            xhr.onerror = () => reject(new Error("Convert failed"));
            xhr.onabort = () => reject(new Error("Convert aborted"));
            xhr.onload = async () => {
              const status = Number(xhr.status || 0) || 0;
              const resp = xhr.response || null;
              if (typeof onProgress === "function") {
                try {
                  onProgress(100);
                } catch {}
              }
              if (status >= 200 && status < 300) {
                const fmt = String(xhr.getResponseHeader("x-converted-format") || "").trim();
                resolve({ blob: resp, format: fmt });
                return;
              }
              try {
                const t = await blobToText(resp);
                let j = null;
                try {
                  j = t ? JSON.parse(t) : null;
                } catch {
                  j = null;
                }
                if (j && (j.message || j.error)) {
                  const baseMsg = String(j.message || j.error || "");
                  let detMsg = "";
                  try {
                    if (Array.isArray(j.details) && j.details.length) {
                      detMsg = j.details[0] && j.details[0].message ? String(j.details[0].message) : String(j.details[0] || "");
                    } else if (j.details && typeof j.details === "object") {
                      if (j.details.message) detMsg = String(j.details.message || "");
                      else if (j.details.details && typeof j.details.details === "object" && j.details.details.message) detMsg = String(j.details.details.message || "");
                    }
                  } catch {}
                  detMsg = String(detMsg || "").trim();
                  const msg = detMsg && detMsg !== baseMsg ? (baseMsg + " (" + detMsg + ")") : baseMsg;
                  reject(new Error(msg || ("HTTP " + String(status))));
                } else {
                  reject(new Error(String(t || ("HTTP " + String(status)))));
                }
              } catch {
                reject(new Error("Convert failed"));
              }
            };

            try {
              xhr.send(f);
            } catch (e) {
              reject(e);
            }
          });
        };

        const maxConvertFilesForPlan = (k) => {
          const plan = String(k || "").trim().toLowerCase();
          if (plan === "business") return 50;
          if (plan === "pro") return 10;
          return 0;
        };

        const maxUploadFilesForPlan = (k) => {
          const plan = String(k || "").trim().toLowerCase();
          if (plan === "business") return 50;
          if (plan === "pro") return 10;
          return 1;
        };

        const revokeConvertObjectUrls = () => {
          try {
            const items = Array.isArray(state.convertItems) ? state.convertItems : [];
            for (let i = 0; i < items.length; i += 1) {
              const u = String((items[i] && items[i].resultUrl) || "");
              if (!u) continue;
              try {
                URL.revokeObjectURL(u);
              } catch {}
              try {
                const set = window.__bundleAppMediaBlobUrls;
                if (set && set.delete) set.delete(u);
              } catch {}
            }
          } catch {}
        };

        const readArrayBufferFromUrl = async (src) => {
          const u = String(src || "");
          if (!u) throw new Error("Missing url");
          return await new Promise((resolve, reject) => {
            let xhr = null;
            try {
              xhr = new XMLHttpRequest();
            } catch {
              xhr = null;
            }
            if (!xhr) {
              reject(new Error("Download not supported"));
              return;
            }
            try {
              xhr.open("GET", u, true);
              xhr.responseType = "arraybuffer";
            } catch {
              reject(new Error("Download not supported"));
              return;
            }
            xhr.onerror = () => reject(new Error("Failed to read output"));
            xhr.onabort = () => reject(new Error("Aborted"));
            xhr.onload = () => {
              const status = Number(xhr.status || 0) || 0;
              if (status === 0 || (status >= 200 && status < 300)) {
                resolve(xhr.response || new ArrayBuffer(0));
                return;
              }
              reject(new Error("Failed to read output"));
            };
            try {
              xhr.send();
            } catch (e) {
              reject(e);
            }
          });
        };

        const encodeUtf8 = (s) => {
          const str = String(s == null ? "" : s);
          try {
            if (window.TextEncoder) return new TextEncoder().encode(str);
          } catch {}
          let bin = "";
          try {
            bin = unescape(encodeURIComponent(str));
          } catch {
            bin = str;
          }
          const out = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i) & 255;
          return out;
        };

        const crcTable = (() => {
          const t = new Uint32Array(256);
          for (let i = 0; i < 256; i += 1) {
            let c = i;
            for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            t[i] = c >>> 0;
          }
          return t;
        })();

        const crc32 = (u8) => {
          let crc = 0xffffffff;
          const a = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8 || []);
          for (let i = 0; i < a.length; i += 1) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ a[i]) & 255];
          }
          return (crc ^ 0xffffffff) >>> 0;
        };

        const mkZip = (files) => {
          const list = Array.isArray(files) ? files : [];
          const parts = [];
          const cd = [];
          let offset = 0;

          const pushU16 = (view, p, v) => view.setUint16(p, v & 0xffff, true);
          const pushU32 = (view, p, v) => view.setUint32(p, v >>> 0, true);

          for (let i = 0; i < list.length; i += 1) {
            const it = list[i] || {};
            const nameBytes = encodeUtf8(String(it.name || ("file_" + String(i + 1))));
            const data = it.data instanceof Uint8Array ? it.data : new Uint8Array(it.data || []);
            const crc = crc32(data);

            const local = new Uint8Array(30 + nameBytes.length);
            const lv = new DataView(local.buffer);
            pushU32(lv, 0, 0x04034b50);
            pushU16(lv, 4, 20);
            pushU16(lv, 6, 0x0800);
            pushU16(lv, 8, 0);
            pushU16(lv, 10, 0);
            pushU16(lv, 12, 0);
            pushU32(lv, 14, crc);
            pushU32(lv, 18, data.length);
            pushU32(lv, 22, data.length);
            pushU16(lv, 26, nameBytes.length);
            pushU16(lv, 28, 0);
            local.set(nameBytes, 30);

            parts.push(local);
            parts.push(data);

            const central = new Uint8Array(46 + nameBytes.length);
            const cv = new DataView(central.buffer);
            pushU32(cv, 0, 0x02014b50);
            pushU16(cv, 4, 20);
            pushU16(cv, 6, 20);
            pushU16(cv, 8, 0x0800);
            pushU16(cv, 10, 0);
            pushU16(cv, 12, 0);
            pushU16(cv, 14, 0);
            pushU32(cv, 16, crc);
            pushU32(cv, 20, data.length);
            pushU32(cv, 24, data.length);
            pushU16(cv, 28, nameBytes.length);
            pushU16(cv, 30, 0);
            pushU16(cv, 32, 0);
            pushU16(cv, 34, 0);
            pushU16(cv, 36, 0);
            pushU32(cv, 38, 0);
            pushU32(cv, 42, offset);
            central.set(nameBytes, 46);
            cd.push(central);

            offset += local.length + data.length;
          }

          const cdOffset = offset;
          for (let i = 0; i < cd.length; i += 1) {
            parts.push(cd[i]);
            offset += cd[i].length;
          }
          const cdSize = offset - cdOffset;

          const eocd = new Uint8Array(22);
          const ev = new DataView(eocd.buffer);
          pushU32(ev, 0, 0x06054b50);
          pushU16(ev, 4, 0);
          pushU16(ev, 6, 0);
          pushU16(ev, 8, cd.length);
          pushU16(ev, 10, cd.length);
          pushU32(ev, 12, cdSize);
          pushU32(ev, 16, cdOffset);
          pushU16(ev, 20, 0);
          parts.push(eocd);

          return new Blob(parts, { type: "application/zip" });
        };

        const downloadBlob = (blob, filename) => {
          const b = blob || null;
          if (!b) return;
          const name = String(filename || "download.zip") || "download.zip";
          let u = "";
          try {
            u = URL.createObjectURL(b);
          } catch {
            u = "";
          }
          if (!u) return;
          const a = document.createElement("a");
          a.href = u;
          a.download = name;
          a.rel = "noopener";
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          try {
            a.remove();
          } catch {}
          try {
            setTimeout(() => {
              try {
                URL.revokeObjectURL(u);
              } catch {}
            }, 5000);
          } catch {}
        };

        const readImageDims = (file) => {
          const f = file || null;
          if (!f) return Promise.resolve(null);
          return new Promise((resolve) => {
            let url = "";
            let img = null;
            const done = (dims) => {
              try {
                if (url && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(url);
              } catch {}
              try {
                if (img) {
                  img.onload = null;
                  img.onerror = null;
                }
              } catch {}
              resolve(dims || null);
            };
            try {
              if (!window.URL || !URL.createObjectURL) {
                done(null);
                return;
              }
              url = URL.createObjectURL(f);
              img = new Image();
              try {
                img.decoding = "async";
              } catch {}
              img.onload = () => {
                try {
                  const w = Number(img.naturalWidth || img.width || 0) || 0;
                  const h = Number(img.naturalHeight || img.height || 0) || 0;
                  done(w > 0 && h > 0 ? { width: w, height: h } : null);
                } catch {
                  done(null);
                }
              };
              img.onerror = () => done(null);
              img.src = url;
            } catch {
              done(null);
            }
          });
        };

        const setConvertFiles = (files) => {
          const fs = Array.isArray(files) ? files : [];
          const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          const maxFiles = maxConvertFilesForPlan(planKey || "basic");
          if (!maxFiles) {
            const planName = planLabel(planKey || "basic");
            state.convertError = isArabic()
              ? "تحويل الصيغ متاحة في Pro و Business فقط" + (planName ? " (خطتك الحالية: " + planName + ")" : "")
              : "Conversion is available in Pro and Business only" + (planName ? " (your plan: " + planName + ")" : "");
            toastError(state.convertError);
            render();
            return;
          }

          const kind = String(state.convertKind || "image") === "video" ? "video" : "image";
          const existing = Array.isArray(state.convertFiles) ? state.convertFiles : [];
          const incoming = [];
          for (let i = 0; i < fs.length; i += 1) {
            const f = fs[i];
            if (!f) continue;
            try {
              if (guessResourceType(f) === kind) incoming.push(f);
            } catch {}
          }

          const ignoredByType = Math.max(0, fs.length - incoming.length);
          const planName = planLabel(planKey || "basic");
          const slots = Math.max(0, maxFiles - existing.length);
          const toAdd = slots > 0 ? incoming.slice(0, slots) : [];
          const ignoredByLimit = Math.max(0, incoming.length - toAdd.length);

          if (!toAdd.length) {
            if (!existing.length && fs.length) {
              state.convertError = isArabic()
                ? (kind === "video" ? "اختر فيديو فقط" : "اختر صور فقط")
                : (kind === "video" ? "Please select videos only" : "Please select images only");
              toastWarn(state.convertError);
            } else {
              if (ignoredByType > 0) {
                toastWarn(
                  isArabic()
                    ? "تم تجاهل " + String(ignoredByType) + " ملف لأنه لا يطابق نوع التحويل"
                    : "Ignored " + String(ignoredByType) + " file(s) that don't match the selected type"
                );
              }
              if (ignoredByLimit > 0) {
                toastWarn(
                  isArabic()
                    ? ("وصلت للحد الأقصى (" + String(maxFiles) + ") لباقة " + planName + " — احذف من الموجودين لإضافة ملفات جديدة")
                    : ("Reached " + planName + " limit (" + String(maxFiles) + ") — remove some files to add more")
                );
              }
            }
            render();
            return;
          }

          const next = existing.concat(toAdd);
          state.convertFiles = next;
          const current = state.convertFile;
          state.convertFile = current && next.includes(current) ? current : (next[0] || null);

          let defaultFmt = kind === "video" ? String(state.convertFormat || "mp4") : String(state.convertFormat || "keep");
          if (kind !== "video" && defaultFmt === "auto") defaultFmt = "keep";

          const oldFormats = Array.isArray(state.convertFileFormats) ? state.convertFileFormats : [];
          const oldFormatsCustom = Array.isArray(state.convertFileFormatCustom) ? state.convertFileFormatCustom : [];
          const nextFormats = [];
          const nextFormatsCustom = [];
          for (let i = 0; i < next.length; i += 1) {
            if (i < existing.length) {
              nextFormats[i] = String(oldFormats[i] || defaultFmt);
              nextFormatsCustom[i] = Boolean(oldFormatsCustom[i]);
            } else {
              nextFormats[i] = defaultFmt;
              nextFormatsCustom[i] = false;
            }
          }
          state.convertFileFormats = nextFormats;
          state.convertFileFormatCustom = nextFormatsCustom;

          if (kind === "video") {
            state.convertFilePresets = [];
            state.convertFilePresetCustom = [];
          } else {
            if (next.length > 1) state.convertPreset = "original";
            const p0 = String(state.convertPreset || "original") || "original";
            const oldPresets = Array.isArray(state.convertFilePresets) ? state.convertFilePresets : [];
            const oldPresetsCustom = Array.isArray(state.convertFilePresetCustom) ? state.convertFilePresetCustom : [];
            const nextPresets = [];
            const nextPresetsCustom = [];
            for (let i = 0; i < next.length; i += 1) {
              if (i < existing.length) {
                nextPresets[i] = String(oldPresets[i] || p0);
                nextPresetsCustom[i] = Boolean(oldPresetsCustom[i]);
              } else {
                nextPresets[i] = p0;
                nextPresetsCustom[i] = false;
              }
            }
            state.convertFilePresets = nextPresets;
            state.convertFilePresetCustom = nextPresetsCustom;
          }

          state.convertError = "";
          state.convertItems = [];
          state.converting = false;
          state.convertProgress = 0;
          state.convertOverallProgress = 0;
          state.convertResultUrl = "";
          state.convertResultBytes = 0;
          state.convertResultFormat = "";
          state.convertUploading = false;
          state.convertUploadProgress = 0;
          state.convertUploadLoaded = 0;
          state.convertUploadTotal = 0;
          state.convertUploadError = "";
          state.convertUploadUrl = "";
          state.convertUploadPublicId = "";
          state.convertDownloadingAll = false;
          state.convertUploadingAll = false;
          try {
            if (convertObjUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(convertObjUrl);
          } catch {}
          convertObjUrl = "";

          if (kind === "image") {
            const oldDims = Array.isArray(state.convertFileDims) ? state.convertFileDims : [];
            const nextDims = [];
            for (let i = 0; i < next.length; i += 1) {
              nextDims[i] = i < existing.length ? (oldDims[i] || null) : null;
            }
            state.convertFileDims = nextDims;
            state.convertFileDimsLoading = Boolean(next.length);
            const dimsToken = String(Date.now()) + "_" + String(Math.random()).slice(2);
            state.convertDimsToken = dimsToken;
            (async () => {
              const nextDims2 = Array.isArray(state.convertFileDims) && state.convertFileDims.length === next.length
                ? state.convertFileDims.slice(0)
                : next.map(() => null);
              for (let i = 0; i < next.length; i += 1) {
                if (state.convertDimsToken !== dimsToken) return;
                if (nextDims2[i]) continue;
                const f = next[i] || null;
                const dims = await readImageDims(f);
                if (state.convertDimsToken !== dimsToken) return;
                nextDims2[i] = dims;
              }
              if (state.convertDimsToken !== dimsToken) return;
              state.convertFileDims = nextDims2;
              state.convertFileDimsLoading = false;
              render();
            })();
          } else {
            state.convertFileDims = [];
            state.convertFileDimsLoading = false;
          }

          if (ignoredByType > 0) {
            toastWarn(
              isArabic()
                ? "تم تجاهل " + String(ignoredByType) + " ملف لأنه لا يطابق نوع التحويل"
                : "Ignored " + String(ignoredByType) + " file(s) that don't match the selected type"
            );
          }
          if (ignoredByLimit > 0) {
            toastWarn(
              isArabic()
                ? ("وصلت للحد الأقصى (" + String(maxFiles) + ") لباقة " + planName + " — احذف من الموجودين لإضافة ملفات جديدة")
                : ("Reached " + planName + " limit (" + String(maxFiles) + ") — remove some files to add more")
            );
          }
          toastInfo(
            isArabic()
              ? ("تمت إضافة " + String(toAdd.length) + " ملف")
              : ("Added " + String(toAdd.length) + " file(s)")
          );
          render();
        };

        const runConvert = async () => {
          if (state.converting) return;

          const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          const maxFiles = maxConvertFilesForPlan(planKey || "basic");
          if (!maxFiles) {
            const planName = planLabel(planKey || "basic");
            state.convertError = isArabic()
              ? "تحويل الصيغ متاحة في Pro و Business فقط" + (planName ? " (خطتك الحالية: " + planName + ")" : "")
              : "Conversion is available in Pro and Business only" + (planName ? " (your plan: " + planName + ")" : "");
            toastError(state.convertError);
            render();
            return;
          }

          const fs = Array.isArray(state.convertFiles) ? state.convertFiles : [];
          if (!fs.length) {
            state.convertError = isArabic() ? "اختر ملفات أولاً" : "Pick files first";
            toastWarn(state.convertError);
            render();
            return;
          }

          state.convertError = "";
          state.converting = true;
          state.convertDownloadingAll = false;
          state.convertUploadingAll = false;
          state.convertProgress = 0;
          state.convertOverallProgress = 0;
          try {
            revokeConvertObjectUrls();
          } catch {}
          state.convertItems = [];
          render();

          const toastId = toastLoading(isArabic() ? "جاري تحويل الملفات..." : "Converting files...");
          let errToastBudget = 3;
          const chosen = fs.slice(0, maxFiles);
          if (fs.length !== chosen.length) {
            state.convertFiles = chosen;
            const planName = planLabel(planKey || "basic");
            toastWarn(
              isArabic()
                ? "باقة " + planName + " تسمح بتحويل " + String(maxFiles) + " ملف فقط في المرة — تم تقليل القائمة"
                : planName + " allows converting " + String(maxFiles) + " files per run — selection was trimmed"
            );
          }

          const items = [];
          const chosenFormats = Array.isArray(state.convertFileFormats) ? state.convertFileFormats : [];
          const chosenPresets = Array.isArray(state.convertFilePresets) ? state.convertFilePresets : [];
          for (let i = 0; i < chosen.length; i += 1) {
            const f = chosen[i];
            const id = String(Date.now()) + "_" + String(Math.random()).slice(2) + "_" + String(i);
            const fallbackFmt = String(state.convertFormat || (String(state.convertKind || "image") === "video" ? "mp4" : "keep"));
            let targetFormat = String(chosenFormats[i] || fallbackFmt || "").trim().toLowerCase();
            if (targetFormat === "auto") targetFormat = "keep";
            const fallbackPreset = String(state.convertPreset || "original") || "original";
            const targetPreset = String(chosenPresets[i] || fallbackPreset || "original").trim().toLowerCase();
            items.push({
              id,
              file: f,
              name: String((f && f.name) || ""),
              inBytes: Number((f && f.size) || 0) || 0,
              outBytes: 0,
              outFormat: "",
              targetFormat,
              targetPreset,
              status: "queued",
              progress: 0,
              error: "",
              resultUrl: "",
              uploading: false,
              uploadProgress: 0,
              uploadError: "",
              uploadUrl: ""
            });
          }
          state.convertItems = items;
          render();

          const q = state.convertQuality != null ? Number(state.convertQuality) : null;
          try {
            for (let i = 0; i < items.length; i += 1) {
              const it = items[i];
              const f = it.file;
              if (!f) continue;
              it.status = "running";
              it.progress = 0;
              render();
              try {
                const isVideo = guessResourceType(f) === "video";
                const rawTarget = String((it && it.targetFormat) || state.convertFormat || "").trim().toLowerCase();
                const safeTarget = rawTarget === "auto" ? "" : rawTarget;
                const normalizedTarget = (() => {
                  if (isVideo) return safeTarget === "mp4" || safeTarget === "webm" || safeTarget === "webm_local" || safeTarget === "mpeg" ? safeTarget : "";
                  return safeTarget;
                })();
                const targetFmt = isVideo ? (normalizedTarget || "mp4") : (normalizedTarget || "keep");
                const onProg = (p) => {
                  try {
                    const pct = Math.max(0, Math.min(100, Number(p || 0) || 0));
                    it.progress = pct;
                    state.convertOverallProgress = Math.round(((i + pct / 100) / items.length) * 100);
                    render();
                  } catch {}
                };
                const out =
                  isVideo
                    ? (targetFmt === "mpeg"
                        ? await convertVideoToMpegOnClient(f, { speed: state.convertSpeed, quality: q, name: it.name }, onProg)
                        : await convertVideoOnClient(f, { format: targetFmt, speed: state.convertSpeed, quality: q, name: it.name }, onProg))
                    : await convertOnBackend(
                        f,
                        {
                          format: safeTarget || "keep",
                          speed: state.convertSpeed,
                          quality: q,
                          name: it.name,
                          preset: String((it && it.targetPreset) || state.convertPreset || "original"),
                          width: "",
                          height: "",
                          mode: "fit",
                          position: ""
                        },
                        onProg
                      );
                const b = out && out.blob ? out.blob : null;
                if (!b || !b.size) throw new Error("Empty response");
                const obj = URL.createObjectURL(b);
                try {
                  if (!window.__bundleAppMediaBlobUrls) window.__bundleAppMediaBlobUrls = new Set();
                } catch {}
                try {
                  if (window.__bundleAppMediaBlobUrls && window.__bundleAppMediaBlobUrls.add) window.__bundleAppMediaBlobUrls.add(obj);
                } catch {}

                it.resultUrl = obj;
                it.outBytes = Number(b.size || 0) || 0;
                it.outFormat = String((out && out.format) || "").trim().toLowerCase();
                it.progress = 100;
                it.status = "done";
                state.convertOverallProgress = Math.round(((i + 1) / items.length) * 100);
                render();
              } catch (e) {
                const msg = friendlyApiErrorMessage(e);
                it.status = "error";
                it.progress = 0;
                it.error = msg;
                state.convertOverallProgress = Math.round(((i + 1) / items.length) * 100);
                render();
                if (errToastBudget > 0) {
                  errToastBudget -= 1;
                  toastError(msg, (isArabic() ? "فشل التحويل" : "Conversion failed") + (it && it.name ? ": " + String(it.name || "") : ""));
                }
              }
            }
          } finally {
            toastClose(toastId);
          }

          state.converting = false;
          state.convertOverallProgress = 100;
          render();
          try {
            const failed = items.filter((x) => x && String(x.status || "") === "error");
            const ok = items.filter((x) => x && String(x.status || "") === "done");
            if (!failed.length) toastSuccess(isArabic() ? ("تم تحويل " + String(ok.length) + " ملف") : ("Converted " + String(ok.length) + " files"));
            else toastWarn(isArabic() ? ("اكتمل التحويل مع أخطاء (" + String(ok.length) + " ناجح / " + String(failed.length) + " فشل)") : ("Conversion finished with errors (" + String(ok.length) + " ok / " + String(failed.length) + " failed)"));
          } catch {}
        };

        const uploadConvertedById = async (id) => {
          const targetId = String(id || "").trim();
          if (!targetId) return;
          const items = Array.isArray(state.convertItems) ? state.convertItems : [];
          const it = items.find((x) => x && String(x.id || "") === targetId) || null;
          if (!it || it.uploading || it.uploadUrl || !it.resultUrl) return;
          if (isSandbox) {
            it.uploadError = isArabic() ? "وضع Sandbox: الرفع غير متاح" : "Sandbox mode: upload disabled";
            render();
            toastError(it.uploadError);
            return;
          }

          it.uploadError = "";
          it.uploading = true;
          it.uploadProgress = 0;
          render();

          const toastId = toastLoading(isArabic() ? "جاري رفع الملف المحوّل..." : "Uploading converted file...");
          try {
            const raw = String((it.file && it.file.name) || it.name || "converted");
            let baseName = raw;
            const dot = baseName.lastIndexOf(".");
            if (dot > 0) baseName = baseName.slice(0, dot);
            baseName = baseName.slice(0, 120) || "converted";

            const rf = String(it.outFormat || "").trim().toLowerCase();
            const fmt = String(it.targetFormat || state.convertFormat || "").trim().toLowerCase();
            let extFromName = "";
            try {
              const n = String((it.file && it.file.name) || "");
              const d = n.lastIndexOf(".");
              if (d > 0) extFromName = String(n.slice(d + 1) || "").trim().toLowerCase();
            } catch {}
            const ext =
              (rf ? rf : "") ||
              (fmt === "keep"
                ? (extFromName === "jpg" ? "jpeg" : extFromName)
                : "") ||
              (fmt === "mpeg"
                ? "mpeg"
                  : fmt === "mp4"
                    ? "mp4"
                    : fmt === "webm" || fmt === "webm_local"
                      ? "webm"
                      : fmt === "avif"
                        ? "avif"
                        : fmt === "webp"
                          ? "webp"
                          : fmt === "jpeg"
                            ? "jpeg"
                            : fmt === "png"
                              ? "png"
                              : "webp");

            const mime =
              ext === "mp4"
                ? "video/mp4"
                  : ext === "webm"
                    ? "video/webm"
                    : ext === "mpeg" || ext === "mpg"
                      ? "video/mpeg"
                    : ext === "png"
                      ? "image/png"
                    : ext === "jpeg" || ext === "jpg"
                        ? "image/jpeg"
                        : ext === "avif"
                          ? "image/avif"
                          : ext === "webp"
                            ? "image/webp"
                            : "";

            const outBlob = await new Promise((resolve, reject) => {
              let xhr = null;
              try {
                xhr = new XMLHttpRequest();
              } catch {
                xhr = null;
              }
              if (!xhr) {
                reject(new Error("Upload not supported"));
                return;
              }
              try {
                xhr.open("GET", String(it.resultUrl || ""), true);
                xhr.responseType = "blob";
              } catch {
                reject(new Error("Upload not supported"));
                return;
              }
              xhr.onerror = () => reject(new Error("Failed to read output"));
              xhr.onabort = () => reject(new Error("Aborted"));
              xhr.onload = () => {
                const status = Number(xhr.status || 0) || 0;
                if (status >= 200 && status < 300) {
                  resolve(xhr.response || null);
                  return;
                }
                reject(new Error("Failed to read output"));
              };
              try {
                xhr.send();
              } catch (e) {
                reject(e);
              }
            });

            if (!outBlob || !outBlob.size) throw new Error("Empty output");

            let file = null;
            const fname = baseName + "." + ext;
            try {
              file = new File([outBlob], fname, { type: mime || String(outBlob.type || "") });
            } catch {
              file = outBlob;
              try {
                file.name = fname;
              } catch {}
              try {
                if (mime) file.type = mime;
              } catch {}
            }

            try {
              const size = Number((file && file.size) || 0) || 0;
              const planKey2 = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
              const planName = planLabel(planKey2 || "basic");
              const limits = getPlanLimits(planKey2 || "basic");
              const usedBytes = Math.max(0, Number(((state.dash && state.dash.summary && state.dash.summary.totalBytes) || 0)) || 0);
              const maxStorageBytes = Math.max(0, Number(limits && limits.maxStorageBytes) || 0);
              const remainBytes0 = Math.max(0, maxStorageBytes - usedBytes);
              const maxFileBytes = Math.max(0, Number(limits && limits.maxFileBytes) || 0);
              if (maxFileBytes && size > maxFileBytes) {
                throw new Error(
                  isArabic()
                    ? "حجم الملف الناتج (" + fmtBytes(size) + ") أكبر من حد باقة " + planName + " (" + fmtBytes(maxFileBytes) + ")"
                    : "Output size (" + fmtBytes(size) + ") exceeds " + planName + " limit (" + fmtBytes(maxFileBytes) + ")"
                );
              }
              if (maxStorageBytes && size > remainBytes0) {
                throw new Error(
                  isArabic()
                    ? "لا توجد مساحة كافية على باقة " + planName + " — المتبقي: " + fmtBytes(remainBytes0)
                    : "Not enough storage on " + planName + " — remaining: " + fmtBytes(remainBytes0)
                );
              }
            } catch (e) {
              throw e;
            }

            const rt = guessResourceType(file);
            const sign = await getSignature(rt, file);
            const uploaded = await uploadToCloudinary(file, sign, (pct) => {
              try {
                it.uploadProgress = Number.isFinite(pct) ? pct : it.uploadProgress;
                render();
              } catch {}
            });

            const saved = await recordAsset(uploaded);
            try {
              clearMediaApiCache();
            } catch {}
            try {
              refreshDashboard();
            } catch {}

            const savedAsset = saved && typeof saved === "object" ? saved.asset : null;
            const delivery = buildDeliveryUrlFromItem(savedAsset || { storeId: merchantId, publicId: uploaded && uploaded.public_id });
            it.uploadUrl = delivery || String((uploaded && (uploaded.secure_url || uploaded.url)) || "");
            it.uploading = false;
            it.uploadProgress = 100;
            render();
            toastClose(toastId);
            toastSuccess(isArabic() ? "تم رفع الملف إلى ملفاتك" : "Uploaded to My files");
          } catch (e) {
            it.uploading = false;
            it.uploadProgress = 0;
            it.uploadError = friendlyApiErrorMessage(e);
            render();
            toastClose(toastId);
            toastError(it.uploadError);
          }
        };

        const uploadAllConverted = async () => {
          if (state.convertUploadingAll) return;
          const items = Array.isArray(state.convertItems) ? state.convertItems : [];
          const done = items.filter((x) => x && String(x.status || "") === "done" && x.resultUrl);
          if (done.length <= 1) return;
          const list = done.filter((x) => x && !x.uploadUrl && !x.uploading);
          if (!list.length) return;
          state.convertUploadingAll = true;
          render();
          toastInfo(isArabic() ? ("بدء رفع " + String(list.length) + " ملف") : ("Starting upload for " + String(list.length) + " files"));
          try {
            for (let i = 0; i < list.length; i += 1) {
              const it = list[i];
              if (!it) continue;
              await uploadConvertedById(String(it.id || ""));
            }
            try {
              const done2 = Array.isArray(state.convertItems) ? state.convertItems : [];
              const ok = done2.filter((x) => x && x.uploadUrl).length;
              toastSuccess(isArabic() ? ("تم رفع " + String(ok) + " ملف") : ("Uploaded " + String(ok) + " files"));
            } catch {}
          } finally {
            state.convertUploadingAll = false;
            render();
          }
        };

        const downloadAllConverted = async () => {
          if (state.convertDownloadingAll) return;
          const items = Array.isArray(state.convertItems) ? state.convertItems : [];
          const done = items.filter((x) => x && String(x.status || "") === "done" && x.resultUrl);
          if (done.length <= 1) return;
          state.convertDownloadingAll = true;
          state.convertError = "";
          render();
          const toastId = toastLoading(isArabic() ? "جاري تجهيز ملف ZIP..." : "Preparing ZIP...");
          try {
            const used = new Map();
            const files = [];
            for (let i = 0; i < done.length; i += 1) {
              const it = done[i] || {};
              const raw = String(it.name || "converted");
              let baseName = raw;
              const dot = baseName.lastIndexOf(".");
              if (dot > 0) baseName = baseName.slice(0, dot);
              baseName = baseName.slice(0, 120) || "converted";
              const rf = String(it.outFormat || "").trim().toLowerCase();
              const fmt = String(it.targetFormat || state.convertFormat || "").trim().toLowerCase();
              const ext =
                (rf ? rf : "") ||
                (fmt === "mp4"
                  ? "mp4"
                    : fmt === "webm" || fmt === "webm_local"
                      ? "webm"
                      : fmt === "avif"
                        ? "avif"
                        : fmt === "webp"
                          ? "webp"
                          : fmt === "jpeg"
                            ? "jpeg"
                            : fmt === "png"
                              ? "png"
                              : "webp");
              let fname = baseName + "." + ext;
              const prev = Number(used.get(fname) || 0) || 0;
              used.set(fname, prev + 1);
              if (prev) {
                const dot2 = fname.lastIndexOf(".");
                fname = dot2 > 0 ? (fname.slice(0, dot2) + " (" + String(prev + 1) + ")" + fname.slice(dot2)) : (fname + " (" + String(prev + 1) + ")");
              }
              const buf = await readArrayBufferFromUrl(String(it.resultUrl || ""));
              files.push({ name: fname, data: new Uint8Array(buf || new ArrayBuffer(0)) });
            }
            const zip = mkZip(files);
            const stamp = (() => {
              try {
                const d = new Date();
                const y = String(d.getFullYear());
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const da = String(d.getDate()).padStart(2, "0");
                const h = String(d.getHours()).padStart(2, "0");
                const mi = String(d.getMinutes()).padStart(2, "0");
                return y + m + da + "_" + h + mi;
              } catch {
                return String(Date.now());
              }
            })();
            downloadBlob(zip, "converted_" + stamp + ".zip");
            toastClose(toastId);
            toastSuccess(isArabic() ? "تم بدء التحميل" : "Download started");
          } catch (e) {
            state.convertError = friendlyApiErrorMessage(e);
            toastClose(toastId);
            toastError(state.convertError);
          } finally {
            state.convertDownloadingAll = false;
            render();
          }
        };

        const openFilesFromConvert = async () => {
          try {
            toastInfo(isArabic() ? "فتح ملفاتك..." : "Opening files...");
            state.view = "files";
            state.type = "";
            state.page = 1;
            state.items = [];
            state.total = 0;
            state.error = "";
            render();
            fetchAndRender(true);
          } catch {}
        };

        const setConvertKind = (k) => {
          const next = String(k || "image");
          if (next !== "image" && next !== "video") return;
          if (next === state.convertKind) return;
          state.convertKind = next;
          try {
            convertInput.accept = next === "video" ? "video/*,.mp4,.webm,.mov,.avi,.m4v,.mkv,.3gp,.3gpp,.3g2" : "image/*";
          } catch {}
          if (next === "video") {
            state.convertFormat = "mp4";
            state.convertPreset = "";
          } else {
            state.convertFormat = "keep";
            state.convertPreset = "original";
          }
          state.convertFile = null;
          state.convertFiles = [];
          state.convertFileFormats = [];
          state.convertFileFormatCustom = [];
          try {
            revokeConvertObjectUrls();
          } catch {}
          state.convertItems = [];
          state.convertError = "";
          state.convertProgress = 0;
          state.convertOverallProgress = 0;
          state.convertResultBytes = 0;
          state.convertResultFormat = "";
          state.convertUploading = false;
          state.convertUploadProgress = 0;
          state.convertUploadLoaded = 0;
          state.convertUploadTotal = 0;
          state.convertUploadError = "";
          state.convertUploadUrl = "";
          state.convertUploadPublicId = "";
          state.convertDownloadingAll = false;
          state.convertUploadingAll = false;
          try {
            if (convertObjUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(convertObjUrl);
          } catch {}
          convertObjUrl = "";
          state.convertResultUrl = "";
          render();
        };

        const resetConvert = () => {
          state.convertFile = null;
          state.convertFiles = [];
          state.convertFileFormats = [];
          state.convertFileFormatCustom = [];
          state.convertError = "";
          state.convertQuality = "";
          state.convertPreset = String(state.convertKind || "image") === "video" ? "" : "original";
          state.convertWidth = "";
          state.convertHeight = "";
          state.convertMode = "fit";
          state.convertPosition = "";
          state.convertProgress = 0;
          state.convertOverallProgress = 0;
          state.convertResultBytes = 0;
          state.convertResultFormat = "";
          state.convertUploading = false;
          state.convertUploadProgress = 0;
          state.convertUploadLoaded = 0;
          state.convertUploadTotal = 0;
          state.convertUploadError = "";
          state.convertUploadUrl = "";
          state.convertUploadPublicId = "";
          state.convertDownloadingAll = false;
          state.convertUploadingAll = false;
          try {
            revokeConvertObjectUrls();
          } catch {}
          state.convertItems = [];
          try {
            if (convertObjUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(convertObjUrl);
          } catch {}
          convertObjUrl = "";
          state.convertResultUrl = "";
          render();
        };

        const maxCompressFilesForPlan = (k) => {
          const plan = String(k || "").trim().toLowerCase();
          if (plan === "business") return 50;
          if (plan === "pro") return 10;
          return 1;
        };

        const revokeCompressObjectUrls = () => {
          try {
            const items = Array.isArray(state.compressItems) ? state.compressItems : [];
            for (let i = 0; i < items.length; i += 1) {
              const u = String((items[i] && items[i].resultUrl) || "");
              if (!u) continue;
              try {
                URL.revokeObjectURL(u);
              } catch {}
              try {
                const set = window.__bundleAppMediaBlobUrls;
                if (set && set.delete) set.delete(u);
              } catch {}
            }
          } catch {}
        };

        const resetCompress = () => {
          try {
            revokeCompressObjectUrls();
          } catch {}
          state.compressFiles = [];
          state.compressError = "";
          state.compressItems = [];
          state.compressRunning = false;
          state.compressOverallProgress = 0;
          state.compressUploadingAny = false;
          state.compressUploadingAll = false;
          state.compressDownloadingAll = false;
          render();
        };

        const setCompressFiles = (files) => {
          const fs = Array.isArray(files) ? files : [];
          const imgs = [];
          for (let i = 0; i < fs.length; i += 1) {
            const f = fs[i];
            if (!f) continue;
            try {
              if (guessResourceType(f) === "image") imgs.push(f);
            } catch {}
          }
          const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          const planName = planLabel(planKey || "basic");
          const maxFiles = maxCompressFilesForPlan(planKey || "basic");
          const existing = Array.isArray(state.compressFiles) ? state.compressFiles : [];
          const ignoredByType = Math.max(0, fs.length - imgs.length);
          const slots = Math.max(0, maxFiles - existing.length);
          const toAdd = slots > 0 ? imgs.slice(0, slots) : [];
          const ignoredByLimit = Math.max(0, imgs.length - toAdd.length);

          if (!toAdd.length) {
            if (!existing.length && fs.length) {
              state.compressError = isArabic() ? "اختر صور فقط" : "Please select images only";
              toastWarn(state.compressError);
            } else {
              if (ignoredByType > 0) toastWarn(isArabic() ? "تم تجاهل " + String(ignoredByType) + " ملف لأنه ليس صورة" : "Ignored " + String(ignoredByType) + " non-image file(s)");
              if (ignoredByLimit > 0) {
                toastWarn(
                  isArabic()
                    ? ("وصلت للحد الأقصى (" + String(maxFiles) + ") لباقة " + planName + " — احذف من الموجودين لإضافة صور جديدة")
                    : ("Reached " + planName + " limit (" + String(maxFiles) + ") — remove some images to add more")
                );
              }
            }
            render();
            return;
          }

          state.compressFiles = existing.concat(toAdd);
          state.compressItems = [];
          state.compressRunning = false;
          state.compressOverallProgress = 0;
          state.compressUploadingAny = false;
          state.compressUploadingAll = false;
          state.compressError = "";
          if (ignoredByType > 0) toastWarn(isArabic() ? "تم تجاهل " + String(ignoredByType) + " ملف لأنه ليس صورة" : "Ignored " + String(ignoredByType) + " non-image file(s)");
          if (ignoredByLimit > 0) {
            toastWarn(
              isArabic()
                ? ("وصلت للحد الأقصى (" + String(maxFiles) + ") لباقة " + planName + " — احذف من الموجودين لإضافة صور جديدة")
                : ("Reached " + planName + " limit (" + String(maxFiles) + ") — remove some images to add more")
            );
          }
          toastInfo(isArabic() ? ("تمت إضافة " + String(toAdd.length) + " صورة") : ("Added " + String(toAdd.length) + " image(s)"));
          render();
        };

        const compressOnBackend = async (file, opts, onProgress) => {
          if (isSandbox) throw new Error("Sandbox mode: compress disabled");
          const f = file || null;
          if (!f) throw new Error("Missing file");
          const format = String((opts && opts.format) || "keep").trim().toLowerCase();
          const quality = opts && opts.quality != null ? Number(opts.quality) : null;
          const name = String((opts && opts.name) || (f && f.name) || "").trim();
          const maxQuality = 80;

          const url = buildUrl("/api/proxy/tools/compress", {
            format,
            quality:
              quality != null && Number.isFinite(quality)
                ? String(Math.max(1, Math.min(maxQuality, Math.round(quality))))
                : "",
            name
          });
          if (!url) throw new Error("Missing backend origin");

          return await new Promise((resolve, reject) => {
            let xhr = null;
            try {
              xhr = new XMLHttpRequest();
            } catch {
              xhr = null;
            }
            if (!xhr) {
              reject(new Error("Compress not supported"));
              return;
            }

            try {
              xhr.open("POST", url, true);
              try {
                xhr.responseType = "blob";
              } catch {}
              try {
                xhr.setRequestHeader("X-File-Name", String((f && f.name) || ""));
              } catch {}
              try {
                const t = String((f && f.type) || "").trim();
                if (t) xhr.setRequestHeader("Content-Type", t);
              } catch {}
            } catch (e) {
              reject(e);
              return;
            }

            try {
              if (xhr.upload) {
                xhr.upload.onprogress = (ev) => {
                  try {
                    if (typeof onProgress !== "function") return;
                    const loaded = Number(ev && ev.loaded) || 0;
                    const total = Number(ev && ev.total) || 0;
                    if (total > 0) onProgress(Math.max(0, Math.min(70, Math.round((loaded / total) * 70))));
                    else onProgress(0);
                  } catch {}
                };
              }
            } catch {}

            xhr.onerror = () => reject(new Error("Compress failed"));
            xhr.onabort = () => reject(new Error("Compress aborted"));
            xhr.onload = async () => {
              const status = Number(xhr.status || 0) || 0;
              const resp = xhr.response || null;
              if (typeof onProgress === "function") {
                try {
                  onProgress(100);
                } catch {}
              }
              if (status >= 200 && status < 300) {
                const fmt = String(xhr.getResponseHeader("x-output-format") || xhr.getResponseHeader("x-converted-format") || "").trim();
                resolve({ blob: resp, format: fmt });
                return;
              }
              try {
                const t = await blobToText(resp);
                let j = null;
                try {
                  j = t ? JSON.parse(t) : null;
                } catch {
                  j = null;
                }
                reject(new Error(String((j && (j.message || j.error)) || t || ("HTTP " + String(status)))));
              } catch {
                reject(new Error("Compress failed"));
              }
            };

            try {
              xhr.send(f);
            } catch (e) {
              reject(e);
            }
          });
        };

        const runCompress = async () => {
          if (state.compressRunning) return;
          if (isSandbox) {
            toastError(isArabic() ? "وضع Sandbox: الضغط غير متاح" : "Sandbox mode: compression disabled");
            return;
          }
          const fs = Array.isArray(state.compressFiles) ? state.compressFiles : [];
          if (!fs.length) {
            toastWarn(isArabic() ? "اختر صور أولاً" : "Pick images first");
            return;
          }

          state.compressError = "";
          state.compressItems = [];
          state.compressRunning = true;
          state.compressDownloadingAll = false;
          state.compressOverallProgress = 0;
          state.compressUploadingAny = false;
          render();

          const toastId = toastLoading(isArabic() ? "جاري ضغط الصور..." : "Compressing images...");
          let errToastBudget = 3;
          const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          const maxFiles = maxCompressFilesForPlan(planKey || "basic");
          const chosen = fs.slice(0, maxFiles);
          if (fs.length !== chosen.length) {
            state.compressFiles = chosen;
            const planName = planLabel(planKey || "basic");
            toastWarn(
              isArabic()
                ? "باقة " + planName + " تسمح بضغط " + String(maxFiles) + " صورة فقط في المرة — تم تقليل القائمة"
                : planName + " allows compressing " + String(maxFiles) + " images per run — selection was trimmed"
            );
          }

          const items = [];
          for (let i = 0; i < chosen.length; i += 1) {
            const f = chosen[i];
            const id = String(Date.now()) + "_" + String(Math.random()).slice(2) + "_" + String(i);
            items.push({
              id,
              file: f,
              name: String((f && f.name) || ""),
              inBytes: Number((f && f.size) || 0) || 0,
              outBytes: 0,
              outFormat: "",
              status: "queued",
              progress: 0,
              error: "",
              resultUrl: "",
              uploading: false,
              uploadProgress: 0,
              uploadError: "",
              uploadUrl: ""
            });
          }
          state.compressItems = items;
          render();

          const qRaw = state.compressQuality ? Number(state.compressQuality) : null;
          const q = qRaw != null && Number.isFinite(qRaw) ? Math.max(1, Math.min(80, Math.round(qRaw))) : null;
          const format = "keep";

          const guessExt = (f, b, hinted) => {
            const h = String(hinted || "").trim().toLowerCase();
            if (h) return h;
            const mt = String((b && b.type) || "").trim().toLowerCase();
            if (mt === "image/png") return "png";
            if (mt === "image/jpeg" || mt === "image/jpg") return "jpeg";
            if (mt === "image/webp") return "webp";
            if (mt === "image/avif") return "avif";
            const n = String((f && f.name) || "").trim();
            const dot = n.lastIndexOf(".");
            const ext = dot > 0 ? n.slice(dot + 1).trim().toLowerCase() : "";
            if (ext === "jpg") return "jpeg";
            if (ext === "jpeg" || ext === "png" || ext === "webp" || ext === "avif") return ext;
            return "";
          };

          try {
            for (let i = 0; i < items.length; i += 1) {
              const it = items[i];
              const f = it && it.file ? it.file : null;
              if (!f) continue;
              try {
                it.status = "compressing";
                it.error = "";
                it.progress = 0;
                render();

                const out = await compressOnBackend(
                  f,
                  { format, quality: q, name: it.name },
                  (p) => {
                    try {
                      it.progress = Number(p || 0) || 0;
                      const pct = Math.max(0, Math.min(100, Number(p || 0) || 0));
                      state.compressOverallProgress = Math.round(((i + pct / 100) / items.length) * 100);
                      render();
                    } catch {}
                  }
                );
                const b = out && out.blob ? out.blob : null;
                if (!b || !b.size) throw new Error("Empty response");
                const obj = URL.createObjectURL(b);
                try {
                  if (!window.__bundleAppMediaBlobUrls) window.__bundleAppMediaBlobUrls = new Set();
                } catch {}
                try {
                  if (window.__bundleAppMediaBlobUrls && window.__bundleAppMediaBlobUrls.add) window.__bundleAppMediaBlobUrls.add(obj);
                } catch {}

                it.resultUrl = obj;
                it.outBytes = Number(b.size || 0) || 0;
                it.outFormat = guessExt(f, b, out && out.format);
                it.progress = 100;
                it.status = "done";
                state.compressOverallProgress = Math.round(((i + 1) / items.length) * 100);
                render();
              } catch (e) {
                const msg = friendlyApiErrorMessage(e);
                it.status = "error";
                it.progress = 0;
                it.error = msg;
                state.compressOverallProgress = Math.round(((i + 1) / items.length) * 100);
                render();
                if (errToastBudget > 0) {
                  errToastBudget -= 1;
                  toastError(msg, (isArabic() ? "فشل الضغط" : "Compression failed") + (it && it.name ? ": " + String(it.name || "") : ""));
                }
              }
            }
          } finally {
            toastClose(toastId);
          }

          state.compressRunning = false;
          state.compressOverallProgress = 100;
          render();
          try {
            const failed = items.filter((x) => x && String(x.status || "") === "error");
            const ok = items.filter((x) => x && String(x.status || "") === "done");
            if (!failed.length) toastSuccess(isArabic() ? ("تم ضغط " + String(ok.length) + " صورة") : ("Compressed " + String(ok.length) + " images"));
            else toastWarn(isArabic() ? ("اكتمل الضغط مع أخطاء (" + String(ok.length) + " ناجح / " + String(failed.length) + " فشل)") : ("Compression finished with errors (" + String(ok.length) + " ok / " + String(failed.length) + " failed)"));
          } catch {}
        };

        const uploadCompressedById = async (id, opts) => {
          const targetId = String(id || "").trim();
          if (!targetId) return;
          const silent = Boolean(opts && opts.silent);
          const items = Array.isArray(state.compressItems) ? state.compressItems : [];
          const it = items.find((x) => x && String(x.id || "") === targetId) || null;
          if (!it || it.uploading || it.uploadUrl || !it.resultUrl) return;
          if (isSandbox) {
            it.uploadError = isArabic() ? "وضع Sandbox: الرفع غير متاح" : "Sandbox mode: upload disabled";
            render();
            if (!silent) toastError(it.uploadError);
            return;
          }

          it.uploadError = "";
          it.uploading = true;
          it.uploadProgress = 0;
          state.compressUploadingAny = true;
          render();

          const toastId = silent ? "" : toastLoading(isArabic() ? "جاري رفع الصورة المضغوطة..." : "Uploading compressed image...");
          try {
            const raw = String(it.name || "compressed");
            let baseName = raw;
            const dot = baseName.lastIndexOf(".");
            if (dot > 0) baseName = baseName.slice(0, dot);
            baseName = baseName.slice(0, 120) || "compressed";

            const rawExt = String(it.outFormat || "").trim().toLowerCase();
            const ext = rawExt || (() => {
              const n = String(it.name || "").trim();
              const dot2 = n.lastIndexOf(".");
              const e2 = dot2 > 0 ? n.slice(dot2 + 1).trim().toLowerCase() : "";
              if (e2 === "jpg") return "jpeg";
              if (e2 === "jpeg" || e2 === "png" || e2 === "webp" || e2 === "avif") return e2;
              return "jpeg";
            })();
            const mime =
              ext === "png"
                ? "image/png"
                : ext === "jpeg" || ext === "jpg"
                  ? "image/jpeg"
                  : ext === "avif"
                    ? "image/avif"
                    : ext === "webp"
                      ? "image/webp"
                      : "";

            const outBlob = await new Promise((resolve, reject) => {
              let xhr = null;
              try {
                xhr = new XMLHttpRequest();
              } catch {
                xhr = null;
              }
              if (!xhr) {
                reject(new Error("Upload not supported"));
                return;
              }
              try {
                xhr.open("GET", String(it.resultUrl || ""), true);
                xhr.responseType = "blob";
              } catch {
                reject(new Error("Upload not supported"));
                return;
              }
              xhr.onerror = () => reject(new Error("Failed to read output"));
              xhr.onabort = () => reject(new Error("Aborted"));
              xhr.onload = () => {
                const status = Number(xhr.status || 0) || 0;
                if (status >= 200 && status < 300) {
                  resolve(xhr.response || null);
                  return;
                }
                reject(new Error("Failed to read output"));
              };
              try {
                xhr.send();
              } catch (e) {
                reject(e);
              }
            });

            if (!outBlob || !outBlob.size) throw new Error("Empty output");

            let file = null;
            const fname = baseName + "." + ext;
            try {
              file = new File([outBlob], fname, { type: mime || String(outBlob.type || "") });
            } catch {
              file = outBlob;
              try {
                file.name = fname;
              } catch {}
              try {
                if (mime) file.type = mime;
              } catch {}
            }

            try {
              const size = Number((file && file.size) || 0) || 0;
              const planKey2 = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
              const planName = planLabel(planKey2 || "basic");
              const limits = getPlanLimits(planKey2 || "basic");
              const usedBytes = Math.max(0, Number(((state.dash && state.dash.summary && state.dash.summary.totalBytes) || 0)) || 0);
              const maxStorageBytes = Math.max(0, Number(limits && limits.maxStorageBytes) || 0);
              const remainBytes0 = Math.max(0, maxStorageBytes - usedBytes);
              const maxFileBytes = Math.max(0, Number(limits && limits.maxFileBytes) || 0);
              if (maxFileBytes && size > maxFileBytes) {
                throw new Error(
                  isArabic()
                    ? "حجم الصورة الناتجة (" + fmtBytes(size) + ") أكبر من حد باقة " + planName + " (" + fmtBytes(maxFileBytes) + ")"
                    : "Output size (" + fmtBytes(size) + ") exceeds " + planName + " limit (" + fmtBytes(maxFileBytes) + ")"
                );
              }
              if (maxStorageBytes && size > remainBytes0) {
                throw new Error(
                  isArabic()
                    ? "لا توجد مساحة كافية على باقة " + planName + " — المتبقي: " + fmtBytes(remainBytes0)
                    : "Not enough storage on " + planName + " — remaining: " + fmtBytes(remainBytes0)
                );
              }
            } catch (e) {
              throw e;
            }

            const rt = guessResourceType(file);
            const sign = await getSignature(rt, file);
            const uploaded = await uploadToCloudinary(file, sign, (pct) => {
              try {
                it.uploadProgress = Number.isFinite(pct) ? pct : it.uploadProgress;
                render();
              } catch {}
            });

            const saved = await recordAsset(uploaded);
            try {
              clearMediaApiCache();
            } catch {}
            try {
              refreshDashboard();
            } catch {}

            const savedAsset = saved && typeof saved === "object" ? saved.asset : null;
            const delivery = buildDeliveryUrlFromItem(savedAsset || { storeId: merchantId, publicId: uploaded && uploaded.public_id });
            it.uploadUrl = delivery || String((uploaded && (uploaded.secure_url || uploaded.url)) || "");
            it.uploading = false;
            it.uploadProgress = 100;
            it.uploadError = "";
            state.compressUploadingAny = items.some((x) => x && x.uploading);
            render();
            if (!silent) {
              toastClose(toastId);
              toastSuccess(isArabic() ? "تم رفع الصورة إلى ملفاتك" : "Uploaded to My files");
            }
          } catch (e) {
            it.uploading = false;
            it.uploadProgress = 0;
            it.uploadError = friendlyApiErrorMessage(e);
            state.compressUploadingAny = items.some((x) => x && x.uploading);
            render();
            if (!silent) {
              toastClose(toastId);
              toastError(it.uploadError);
            }
          }
        };

        const uploadAllCompressed = async () => {
          if (state.compressUploadingAll) return;
          const items = Array.isArray(state.compressItems) ? state.compressItems : [];
          const todo = items.filter((x) => x && String(x.status || "") === "done" && x.resultUrl && !x.uploadUrl && !x.uploading);
          if (!todo.length) return;
          if (isSandbox) {
            toastError(isArabic() ? "وضع Sandbox: الرفع غير متاح" : "Sandbox mode: upload disabled");
            return;
          }
          state.compressUploadingAll = true;
          render();
          const toastId = toastLoading(isArabic() ? "جاري رفع الصور..." : "Uploading images...");
          let ok = 0;
          let fail = 0;
          try {
            for (let i = 0; i < todo.length; i += 1) {
              const it = todo[i];
              if (!it) continue;
              await uploadCompressedById(String(it.id || ""), { silent: true });
              try {
                const uploaded = items.find((x) => x && String(x.id || "") === String(it.id || "")) || null;
                if (uploaded && uploaded.uploadUrl) ok += 1;
                else fail += 1;
              } catch {
                fail += 1;
              }
            }
          } finally {
            toastClose(toastId);
            state.compressUploadingAll = false;
            render();
          }
          try {
            if (ok && !fail) toastSuccess(isArabic() ? ("تم رفع " + String(ok) + " صورة") : ("Uploaded " + String(ok) + " images"));
            else if (ok && fail) toastWarn(isArabic() ? ("اكتمل الرفع مع أخطاء (" + String(ok) + " ناجح / " + String(fail) + " فشل)") : ("Upload finished with errors (" + String(ok) + " ok / " + String(fail) + " failed)"));
            else if (fail) toastError(isArabic() ? "فشل رفع الصور" : "Failed to upload images");
          } catch {}
        };

        const downloadAllCompressed = async () => {
          if (state.compressDownloadingAll) return;
          const items = Array.isArray(state.compressItems) ? state.compressItems : [];
          const done = items.filter((x) => x && String(x.status || "") === "done" && x.resultUrl);
          if (done.length <= 1) return;
          state.compressDownloadingAll = true;
          state.compressError = "";
          render();
          const toastId = toastLoading(isArabic() ? "جاري تجهيز ملف ZIP..." : "Preparing ZIP...");
          try {
            const used = new Map();
            const files = [];
            for (let i = 0; i < done.length; i += 1) {
              const it = done[i] || {};
              const raw = String(it.name || "compressed");
              let baseName = raw;
              const dot = baseName.lastIndexOf(".");
              if (dot > 0) baseName = baseName.slice(0, dot);
              baseName = baseName.slice(0, 120) || "compressed";
              const ext = String(it.outFormat || "").trim().toLowerCase() || "webp";
              let fname = baseName + "." + ext;
              const prev = Number(used.get(fname) || 0) || 0;
              used.set(fname, prev + 1);
              if (prev) {
                const dot2 = fname.lastIndexOf(".");
                fname = dot2 > 0 ? (fname.slice(0, dot2) + " (" + String(prev + 1) + ")" + fname.slice(dot2)) : (fname + " (" + String(prev + 1) + ")");
              }
              const buf = await readArrayBufferFromUrl(String(it.resultUrl || ""));
              files.push({ name: fname, data: new Uint8Array(buf || new ArrayBuffer(0)) });
            }
            const zip = mkZip(files);
            const stamp = (() => {
              try {
                const d = new Date();
                const y = String(d.getFullYear());
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const da = String(d.getDate()).padStart(2, "0");
                const h = String(d.getHours()).padStart(2, "0");
                const mi = String(d.getMinutes()).padStart(2, "0");
                return y + m + da + "_" + h + mi;
              } catch {
                return String(Date.now());
              }
            })();
            downloadBlob(zip, "compressed_" + stamp + ".zip");
            toastClose(toastId);
            toastSuccess(isArabic() ? "تم بدء التحميل" : "Download started");
          } catch (e) {
            state.compressError = friendlyApiErrorMessage(e);
            toastClose(toastId);
            toastError(state.compressError);
          } finally {
            state.compressDownloadingAll = false;
            render();
          }
        };

        const openFilesFromCompress = async () => {
          try {
            toastInfo(isArabic() ? "فتح ملفاتك..." : "Opening files...");
            state.view = "files";
            state.type = "";
            state.page = 1;
            state.items = [];
            state.total = 0;
            state.error = "";
            render();
            fetchAndRender(true);
          } catch {}
        };

        const render = () => {
          try {
            sheet.tabs.innerHTML = "";
            sheet.actions.innerHTML = "";
            if (sheet.headActions) sheet.headActions.innerHTML = "";
            sheet.uploads.innerHTML = "";
            sheet.content.innerHTML = "";
            sheet.footer.innerHTML = "";

            if (state.view === "upload") {
              const dashLoading = Boolean(state.dashLoading);
              try {
                sheet.content.style.overflow = dashLoading ? "hidden" : "visible";
                sheet.content.style.flex = dashLoading ? "1 1 auto" : "0 0 auto";
                sheet.content.style.minHeight = dashLoading ? "0" : "auto";

                sheet.uploads.style.flex = dashLoading ? "0 0 auto" : "1 1 auto";
                sheet.uploads.style.minHeight = dashLoading ? "" : "0";
                sheet.uploads.style.maxHeight = dashLoading ? "min(360px, 42vh)" : "";
                sheet.uploads.style.overflow = "auto";

                sheet.footer.style.marginTop = "auto";
              } catch {}
            } else {
              try {
                sheet.content.style.overflow = "auto";
                sheet.content.style.flex = "1 1 auto";
                sheet.content.style.minHeight = "0";

                sheet.uploads.style.flex = "0 0 auto";
                sheet.uploads.style.minHeight = "";
                sheet.uploads.style.maxHeight = "min(360px, 42vh)";
                sheet.uploads.style.overflow = "auto";

                sheet.footer.style.marginTop = "";
              } catch {}
            }

            const appendLegalFooter = () => {
              try {
                sheet.footer.appendChild(buildLegalFooter());
              } catch {}
            };

            const labels = isArabic()
              ? { upload: "رفع الملفات", compress: "ضغط الصور", convert: "تحويل الصيغ", files: "ملفاتك", all: "الكل", img: "صور", vid: "فيديو", ref: "تحديث" }
              : { upload: "Upload Center", compress: "Compression", convert: "Conversion Platform", files: "My files", all: "All", img: "Images", vid: "Videos", ref: "Refresh" };

            const appTitle = isArabic() ? "ملاك ابلودر" : "Malak Uploader";
            const viewLabel =
              state.view === "compress"
                ? labels.compress
                : state.view === "convert"
                  ? labels.convert
                  : state.view === "files"
                    ? labels.files
                    : labels.upload;
            if (sheet.title) sheet.title.textContent = String(appTitle) + " — " + String(viewLabel);

            const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
            const allowConvert = planKey === "pro" || planKey === "business";
            if (!allowConvert && state.view === "convert") state.view = "upload";

            const uploadTab = pill(labels.upload, state.view === "upload");
            const compressTab = pill(labels.compress, state.view === "compress");
            const convertTab = pill(labels.convert, state.view === "convert");
            const filesTab = pill(labels.files, state.view === "files");

            const setView = (v) => {
              const next = String(v || "");
              if (!next || next === state.view) return;
              state.view = next;
              state.error = "";
              render();
              if (state.view === "files") fetchAndRender();
              if (state.view === "upload") refreshDashboard();
              if (state.view === "compress") refreshDashboard();
              if (state.view === "convert") refreshDashboard();
            };

            uploadTab.onclick = () => setView("upload");
            compressTab.onclick = () => setView("compress");
            convertTab.onclick = () => setView("convert");
            filesTab.onclick = () => setView("files");
            sheet.tabs.appendChild(uploadTab);
            sheet.tabs.appendChild(compressTab);
            if (allowConvert) sheet.tabs.appendChild(convertTab);
            sheet.tabs.appendChild(filesTab);

            ensureRefreshSpinStyles();
            const refreshBtn = btnGhost(labels.ref);
            refreshBtn.setAttribute("aria-label", labels.ref);
            refreshBtn.setAttribute("title", labels.ref);
            refreshBtn.style.border = "1px solid rgba(24,181,213,.35)";
            refreshBtn.style.background = "rgba(24,181,213,.12)";
            refreshBtn.style.padding = "6px 10px";
            refreshBtn.style.borderRadius = "10px";
            refreshBtn.style.display = "inline-flex";
            refreshBtn.style.alignItems = "center";
            refreshBtn.style.justifyContent = "center";
            refreshBtn.style.gap = "6px";
            const refreshIcon = document.createElement("i");
            refreshIcon.className = "sicon-back";
            refreshIcon.setAttribute("aria-hidden", "true");
            refreshIcon.style.display = "block";
            refreshIcon.style.fontSize = "16px";
            refreshIcon.style.lineHeight = "1";
            refreshIcon.style.pointerEvents = "none";
            refreshIcon.style.transition = "transform .25s ease";
            const refreshLabel = document.createElement("span");
            refreshLabel.textContent = labels.ref;
            refreshLabel.style.fontSize = "11px";
            refreshLabel.style.fontWeight = "900";
            refreshLabel.style.lineHeight = "1";
            refreshBtn.innerHTML = "";
            refreshBtn.appendChild(refreshIcon);
            refreshBtn.appendChild(refreshLabel);
            refreshBtn.style.color = "#18b5d5";
            refreshBtn.disabled = Boolean(state.dashLoading);
            refreshBtn.style.opacity = refreshBtn.disabled ? "0.7" : "1";
            refreshBtn.style.cursor = refreshBtn.disabled ? "not-allowed" : "pointer";
            refreshIcon.style.animation = state.dashLoading ? "bundleapp-rotate 1.1s linear infinite" : "none";
            refreshBtn.onclick = async () => {
              if (refreshBtn.disabled) return;
              const toastId = toastLoading(isArabic() ? "جاري التحديث..." : "Refreshing...");
              try {
                clearMediaApiCache();
              } catch {}
              try {
                await refreshDashboard(true);
              } catch {}
              try {
                if (state.view === "files") await fetchAndRender(true);
              } catch {}
              toastClose(toastId);
              toastSuccess(isArabic() ? "تم التحديث" : "Refreshed");
            };
            if (sheet.headActions) sheet.headActions.appendChild(refreshBtn);
            else sheet.actions.appendChild(refreshBtn);

            if (state.view === "upload" && state.uploads.length) {
              sheet.uploads.style.display = "flex";
              sheet.uploads.innerHTML = "";
              const removeUploadById = (rawId) => {
                try {
                  if (state.uploading) return;
                  const id = String(rawId || "");
                  if (!id) return;
                  state.uploads = (Array.isArray(state.uploads) ? state.uploads : []).filter((x) => x && String(x.id || "") !== id);
                  render();
                } catch {}
              };
              if (Array.isArray(state.uploads) && state.uploads.length > 1) {
                const clearRow = document.createElement("div");
                clearRow.style.display = "flex";
                clearRow.style.width = "100%";
                clearRow.style.justifyContent = "flex-start";
                clearRow.style.alignItems = "center";
                clearRow.style.direction = "ltr";
                clearRow.style.paddingLeft = "2px";

                const clearBtn = btnGhost(isArabic() ? "مسح الكل" : "Clear all");
                clearBtn.disabled = Boolean(state.uploading);
                clearBtn.style.padding = "2px 6px";
                clearBtn.style.borderRadius = "8px";
                clearBtn.style.fontSize = "9px";
                clearBtn.style.fontWeight = "950";
                clearBtn.style.lineHeight = "1";
                clearBtn.style.color = "#ef4444";
                clearBtn.style.marginLeft = "0";
                clearBtn.style.marginRight = "auto";
                try {
                  clearBtn.style.borderColor = "rgba(239,68,68,.45)";
                } catch {}
                try {
                  clearBtn.style.background = "rgba(239,68,68,.08)";
                } catch {}
                clearBtn.style.opacity = clearBtn.disabled ? "0.55" : "1";
                clearBtn.style.cursor = clearBtn.disabled ? "not-allowed" : "pointer";
                clearBtn.onclick = () => {
                  try {
                    if (clearBtn.disabled) return;
                    state.uploads = [];
                    state.uploadError = "";
                    render();
                  } catch {}
                };
                clearRow.appendChild(clearBtn);
                sheet.uploads.appendChild(clearRow);
              }
              for (let i = 0; i < state.uploads.length; i += 1) {
                sheet.uploads.appendChild(renderUploadRow(state.uploads[i], { busy: state.uploading, onRemove: removeUploadById }));
              }
            } else {
              sheet.uploads.style.display = "none";
            }

            if (state.view === "upload") {
              if (state.dashLoading) sheet.content.appendChild(renderLoading());
            if (!state.dashLoading) {
              const maxFiles = maxUploadFilesForPlan(planKey || "basic");
              try {
                input.multiple = maxFiles > 1;
              } catch {}
              const uploadCard = document.createElement("div");
              uploadCard.style.border = "1px solid rgba(255,255,255,.08)";
              uploadCard.style.borderRadius = "16px";
              uploadCard.style.background = "#303030";
              uploadCard.style.padding = "14px";
              uploadCard.style.display = "flex";
              uploadCard.style.flexDirection = "column";
              uploadCard.style.gap = "12px";
              uploadCard.style.flex = "1 1 auto";
              uploadCard.style.minHeight = "0";

              uploadCard.appendChild(renderUploadHero(state.dash));
              uploadCard.appendChild(renderSmartStats(state.dash));
              uploadCard.appendChild(
                renderDropzone({
                  hint: (() => {
                    try {
                      const allowed = getAllowedExtForPlan(planKey || "basic");
                      const planName = planLabel(planKey || "basic");
                      if (!allowed) return isArabic() ? ("الصيغ المتاحة في باقة " + planName + ": كل الصيغ") : ("Allowed formats on " + planName + ": all formats");
                      const arr = Array.from(allowed.values()).map((x) => String(x || "").trim().toUpperCase()).filter(Boolean).sort();
                      const max = 10;
                      const head = arr.slice(0, max);
                      const tail = arr.length > head.length ? " …" : "";
                      const joiner = isArabic() ? "، " : ", ";
                      const list = head.join(joiner) + tail;
                      return isArabic() ? ("الصيغ المتاحة في باقتك (" + planName + "): " + list) : ("Allowed formats on your plan (" + planName + "): " + list);
                    } catch {
                      return "";
                    }
                  })(),
                  hintPopover: (() => {
                    try {
                      return buildAllowedFormatsPopover(planKey || "basic");
                    } catch {
                      return null;
                    }
                  })(),
                  disabled: state.uploading,
                  onPick: () => {
                    try {
                      try {
                        if (input) input.accept = acceptForUploadPlan(planKey || "basic");
                      } catch {}
                      input.click();
                    } catch {}
                  },
                  onFiles: (fs) => runUploads(fs)
                })
              );
              sheet.content.appendChild(uploadCard);
            }
            appendLegalFooter();
            return;
          }

            if (state.view === "compress") {
              if (state.dashLoading) sheet.content.appendChild(renderLoading());
              if (!state.dashLoading) {
                const planKey2 = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
                const maxFiles = maxCompressFilesForPlan(planKey2 || "basic");
                try {
                  compressInput.multiple = maxFiles > 1;
                } catch {}
                const card = renderCompressionPlatform({
                  state,
                  maxFiles,
                  compressInput,
                  onRender: render,
                  onDownloadAll: downloadAllCompressed,
                  onUploadAll: uploadAllCompressed,
                  onPick: () => {
                    try {
                      if (!compressInput) return;
                      try {
                        compressInput.accept = "image/*";
                      } catch {}
                      compressInput.click();
                    } catch {}
                  },
                  onSetFiles: (fs) => setCompressFiles(fs),
                  onRunCompress: runCompress,
                  onReset: resetCompress,
                  onUploadItem: uploadCompressedById,
                  onOpenFiles: openFilesFromCompress
                });
                if (card) sheet.content.appendChild(card);
              }
              appendLegalFooter();
              return;
            }

            if (state.view === "convert") {
              if (state.dashLoading) sheet.content.appendChild(renderLoading());
              if (!state.dashLoading) {
                const planBlocked = !allowConvert;
                const planKey2 = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
                const maxFiles = maxConvertFilesForPlan(planKey2 || "basic");
                try {
                  convertInput.multiple = maxFiles > 1;
                } catch {}
                const card = renderConversionPlatform({
                  state,
                  planBlocked,
                  maxFiles,
                  convertInput,
                  onRender: render,
                  onRunConvert: runConvert,
                  onUploadItem: uploadConvertedById,
                  onUploadAll: uploadAllConverted,
                  onDownloadAll: downloadAllConverted,
                  onOpenFiles: openFilesFromConvert,
                  onSetConvertFiles: setConvertFiles,
                  onSetKind: setConvertKind,
                  onReset: resetConvert
                });
                if (card) sheet.content.appendChild(card);
              }
              appendLegalFooter();
              return;
            }

            const allBtn = pill(labels.all, state.type === "");
            const imgBtn = pill(labels.img, state.type === "image");
            const vidBtn = pill(labels.vid, state.type === "video");
            const tuneFilter = (b) => {
              b.style.padding = "6px 10px";
              b.style.fontSize = "11px";
              b.style.borderRadius = "999px";
              b.style.width = "auto";
              b.style.lineHeight = "1";
            };
            tuneFilter(allBtn);
            tuneFilter(imgBtn);
            tuneFilter(vidBtn);

            const setType = (t) => {
              state.type = t || "";
              state.page = 1;
              state.items = [];
              state.total = 0;
              state.error = "";
              render();
              fetchAndRender();
            };

            allBtn.onclick = () => setType("");
            imgBtn.onclick = () => setType("image");
            vidBtn.onclick = () => setType("video");

            const typeRow = document.createElement("div");
            typeRow.style.display = "flex";
            typeRow.style.gap = "6px";
            typeRow.style.flexWrap = "wrap";
            typeRow.appendChild(allBtn);
            typeRow.appendChild(imgBtn);
            typeRow.appendChild(vidBtn);
            sheet.content.appendChild(typeRow);

            if (state.loading) sheet.content.appendChild(renderLoading());

            if (!state.loading) {
              if (!state.items.length) sheet.content.appendChild(renderEmpty());
              else {
                sheet.content.appendChild(
                  renderGrid(state.items, {
                    deletingId: state.deletingId,
                    onDeleteItem,
                    onCopy: (p) => {
                      try {
                        const ok = Boolean(p && p.ok);
                        if (ok) toastSuccess(isArabic() ? "تم نسخ الرابط" : "Link copied");
                        else toastInfo(isArabic() ? "لو النسخ التلقائي مش شغال، انسخ الرابط من النافذة" : "If auto-copy isn't supported, copy from the popup");
                      } catch {}
                    },
                    onDownload: (p) => {
                      try {
                        const stage = String((p && p.stage) || "").trim().toLowerCase();
                        const name = String((p && p.name) || "").trim();
                        if (stage === "done") toastSuccess(isArabic() ? "تم بدء التحميل" : "Download started", name ? (isArabic() ? "تحميل: " + name : "Downloading: " + name) : undefined);
                        else if (stage === "fallback") toastInfo(isArabic() ? "تم فتح الملف في تبويب جديد" : "Opened in a new tab", name ? (isArabic() ? "فتح: " + name : "Opening: " + name) : undefined);
                      } catch {}
                    }
                  })
                );
              }

              const pager = renderPager({
                page: state.page,
                total: state.total,
                limit: state.limit,
                loading: state.loading,
                onPage: (p) => {
                  try {
                    if (state.loading) return;
                    state.page = Number(p || 1) || 1;
                    state.error = "";
                    render();
                    fetchAndRender();
                  } catch {}
                }
              });
              if (pager) sheet.content.appendChild(pager);
            }

            appendLegalFooter();
          } catch {}
        };

        const fetchAndRender = async (force) => {
          if (state.loading) return;
          try {
            if (!force) {
              const url = buildUrl("/api/proxy/media/assets", {
                resourceType: state.type || "",
                page: state.page || 1,
                limit: state.limit || 24
              });
              const hit = url ? mediaApiPeek(url, ASSETS_TTL_MS) : null;
              if (hit && typeof hit === "object") {
                const itemsHit = Array.isArray(hit.items) ? hit.items : [];
                for (let i = 0; i < itemsHit.length; i += 1) {
                  const it = itemsHit[i];
                  if (!it || typeof it !== "object") continue;
                  if (!it.deliveryUrl) {
                    const u = buildDeliveryUrlFromItem(it);
                    if (u) it.deliveryUrl = u;
                  }
                }
                state.total = Number(hit.total || 0) || 0;
                state.items = itemsHit;
                state.loading = false;
                state.error = "";
                render();
                return;
              }
            }
          } catch {}
          state.loading = true;
          render();
          try {
            const data = await loadAssets(state.type, state.page, state.limit, force);
            const items = Array.isArray(data && data.items) ? data.items : [];
            for (let i = 0; i < items.length; i += 1) {
              const it = items[i];
              if (!it || typeof it !== "object") continue;
              if (!it.deliveryUrl) {
                const u = buildDeliveryUrlFromItem(it);
                if (u) it.deliveryUrl = u;
              }
            }
            state.total = Number((data && data.total) || 0) || 0;
            state.items = items;
            state.loading = false;
            render();
          } catch (err) {
            state.loading = false;
            state.error = friendlyApiErrorMessage(err);
            render();
            toastError(state.error);
          }
        };

        const runUploads = async (files) => {
          if (state.uploading) return;
          const fs0 = Array.isArray(files) ? files : [];
          const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          const maxFiles = maxUploadFilesForPlan(planKey || "basic");
          const existingUploads = Array.isArray(state.uploads) ? state.uploads : [];
          const existingCount = existingUploads.filter((x) => x && String(x.status || "") !== "rejected").length;
          const slots = Math.max(0, maxFiles - existingCount);
          const limits = getPlanLimits(planKey || "basic");
          const allowed = getAllowedExtForPlan(planKey || "basic");
          const allowedText = allowed ? fmtExtSet(allowed, 18) : "";
          const usedBytes = Math.max(0, Number(((state.dash && state.dash.summary && state.dash.summary.totalBytes) || 0)) || 0);
          const maxStorageBytes = Math.max(0, Number(limits && limits.maxStorageBytes) || 0);
          const remainBytes0 = Math.max(0, maxStorageBytes - usedBytes);

          const valid = [];
          const rejected = [];

          for (let i = 0; i < fs0.length; i += 1) {
            const f = fs0[i];
            if (!f) continue;
            const name = String(f.name || "");
            const size = Number(f.size || 0) || 0;
            const ext = normalizeFilenameExt(name);
            if (ext && bannedExt.has(ext)) {
              rejected.push({ file: f, reason: "banned_ext", ext });
              continue;
            }
            if (allowed && ext && !allowed.has(ext)) {
              rejected.push({ file: f, reason: "not_allowed_ext", ext });
              continue;
            }
            if (limits && Number.isFinite(Number(limits.maxFileBytes)) && size > Number(limits.maxFileBytes)) {
              rejected.push({ file: f, reason: "file_too_big", ext });
              continue;
            }
            valid.push(f);
          }

          let remainBytes = remainBytes0;
          const withinStorage = [];
          for (let i = 0; i < valid.length; i += 1) {
            const f = valid[i];
            const size = Number(f && f.size) || 0;
            if (maxStorageBytes > 0 && remainBytes <= 0) {
              rejected.push({ file: f, reason: "storage_full" });
              continue;
            }
            if (maxStorageBytes > 0 && size > remainBytes) {
              rejected.push({ file: f, reason: "storage_full" });
              continue;
            }
            withinStorage.push(f);
            if (maxStorageBytes > 0) remainBytes -= Math.max(0, size);
          }

          const toUpload = withinStorage.slice(0, slots);
          if (withinStorage.length > toUpload.length) {
            for (let i = toUpload.length; i < withinStorage.length; i += 1) {
              rejected.push({ file: withinStorage[i], reason: "queue_full" });
            }
          }

          const rejectsByReason = {};
          for (let i = 0; i < rejected.length; i += 1) {
            const r = rejected[i];
            const k = String(r && r.reason) || "other";
            rejectsByReason[k] = (Number(rejectsByReason[k] || 0) || 0) + 1;
          }

          const planName = planLabel(planKey || "basic");

          const extListFrom = (reason) => {
            const set = new Set();
            for (let i = 0; i < rejected.length; i += 1) {
              const r = rejected[i];
              if (!r || String(r.reason || "") !== String(reason || "")) continue;
              const f = r.file || null;
              const name = String((f && f.name) || "");
              const ext = normalizeFilenameExt(name) || String(r.ext || "");
              if (ext) set.add(ext);
            }
            return Array.from(set.values()).sort();
          };

          const notAllowedExts = extListFrom("not_allowed_ext");
          const summaryParts = [];
          if (fs0.length) {
            summaryParts.push(
              isArabic()
                ? ("تم اختيار " + String(fs0.length) + " ملف")
                : ("Selected " + String(fs0.length) + " files")
            );
          }
          if (toUpload.length) {
            summaryParts.push(
              isArabic()
                ? ("سيتم رفع " + String(toUpload.length))
                : ("Uploading " + String(toUpload.length))
            );
          }
          if (rejected.length) {
            summaryParts.push(
              isArabic()
                ? ("تم تجاهل " + String(rejected.length))
                : ("Skipped " + String(rejected.length))
            );
          }

          const limitMsg =
            withinStorage.length > slots
              ? isArabic()
                ? ("حد الملفات في رفع الملفات لباقة " + planName + " هو " + String(maxFiles) + " ملف — احذف من الموجودين لإضافة ملفات جديدة")
                : ("Upload list limit for " + planName + " is " + String(maxFiles) + " files — remove some to add more")
              : "";
          const limitUpgradeHint =
            false
              ? (planKey === "pro"
                  ? (isArabic() ? "متاحة فقط في Business." : "Available on Business only.")
                  : planKey === "basic"
                    ? (isArabic() ? "متاحة فقط في Pro و Business." : "Available on Pro & Business only.")
                    : "")
              : "";

          const detailParts = [];
          if (rejectsByReason.not_allowed_ext) {
            detailParts.push(
              isArabic()
                ? "صيغ غير مسموحة"
                : "Disallowed formats"
            );
          }
          if (rejectsByReason.banned_ext) {
            detailParts.push(isArabic() ? "صيغ محظورة" : "Blocked formats");
          }
          if (rejectsByReason.file_too_big) {
            const maxText = limits && limits.maxFileBytes ? fmtBytes(limits.maxFileBytes) : "";
            detailParts.push(isArabic() ? ("ملفات أكبر من الحد " + maxText) : ("Files exceed max size " + maxText));
          }
          if (rejectsByReason.storage_full) {
            detailParts.push(isArabic() ? "مساحة غير كافية" : "Insufficient storage");
          }
          if (rejectsByReason.queue_full) {
            detailParts.push(isArabic() ? "القائمة ممتلئة" : "List is full");
          }

          const summaryMsg =
            summaryParts.join(isArabic() ? " — " : " — ") +
            (limitMsg ? (isArabic() ? " — " + limitMsg : " — " + limitMsg) : "") +
            (limitUpgradeHint ? (isArabic() ? " — " + limitUpgradeHint : " — " + limitUpgradeHint) : "") +
            (detailParts.length ? (isArabic() ? " — " + detailParts.join("، ") : " — " + detailParts.join(", ")) : "");

          const fmtExtList = (exts, max) => {
            const list0 = Array.isArray(exts) ? exts : [];
            const safeMax = Math.max(0, Number(max || 0) || 0) || 10;
            const head = list0.slice(0, safeMax).map((x) => String(x || "").trim()).filter(Boolean);
            const tail = list0.length > head.length ? (isArabic() ? "…" : "…") : "";
            return head.join(isArabic() ? "، " : ", ") + (tail ? (isArabic() ? " " + tail : " " + tail) : "");
          };

          const buildAllowedSummaryForPlan = () => {
            if (!allowed) return isArabic() ? ("الصيغ المتاحة في باقة " + planName + ": كل الصيغ") : ("Allowed formats on " + planName + ": all formats");
            const images = [];
            const videos = [];
            const docs = [];
            const archives = [];
            const fonts = [];
            const other = [];

            const imgSet = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif", "svg", "tif", "tiff", "bmp", "heic", "heif"]);
            const vidSet = new Set(["mp4", "webm", "mov", "avi", "m4v", "mkv", "3gp", "3gpp", "3g2"]);
            const docSet = new Set(["pdf"]);
            const arcSet = new Set(["zip"]);
            const fontSet = new Set(["woff", "woff2", "ttf", "otf", "eot"]);

            const arr = Array.from(allowed.values()).map((x) => String(x || "").trim().toLowerCase()).filter(Boolean).sort();
            for (let i = 0; i < arr.length; i += 1) {
              const ext = arr[i];
              if (imgSet.has(ext)) images.push(ext.toUpperCase());
              else if (vidSet.has(ext)) videos.push(ext.toUpperCase());
              else if (docSet.has(ext)) docs.push(ext.toUpperCase());
              else if (arcSet.has(ext)) archives.push(ext.toUpperCase());
              else if (fontSet.has(ext)) fonts.push(ext.toUpperCase());
              else other.push(ext.toUpperCase());
            }

            const parts = [];
            if (images.length) parts.push((isArabic() ? "صور: " : "Images: ") + fmtExtList(images, 6));
            if (videos.length) parts.push((isArabic() ? "فيديو: " : "Videos: ") + fmtExtList(videos, 4));
            if (docs.length) parts.push((isArabic() ? "مستندات: " : "Docs: ") + fmtExtList(docs, 3));
            if (archives.length) parts.push((isArabic() ? "أرشيف: " : "Archives: ") + fmtExtList(archives, 3));
            if (fonts.length) parts.push((isArabic() ? "خطوط: " : "Fonts: ") + fmtExtList(fonts, 5));
            if (other.length) parts.push((isArabic() ? "أخرى: " : "Other: ") + fmtExtList(other, 6));

            const head = isArabic()
              ? ("الصيغ المتاحة في باقة " + planName + ":")
              : ("Allowed formats on " + planName + ":");
            const lines = parts.length ? parts.map((x) => "• " + x) : ["• —"];
            return head + "\\n" + lines.join("\\n");
          };

          const buildSingleRejectToast = (r) => {
            const f = r && r.file ? r.file : null;
            const name = String((f && f.name) || "");
            const size = Number((f && f.size) || 0) || 0;
            const ext = normalizeFilenameExt(name) || String((r && r.ext) || "");
            const extLabel = ext ? String(ext).toUpperCase() : "?";
            const reason = String((r && r.reason) || "");
            if (reason === "banned_ext") {
              return isArabic()
                ? ("صيغة " + extLabel + " محظورة لأسباب أمنية")
                : ("File type " + extLabel + " is blocked for security reasons");
            }
            if (reason === "not_allowed_ext") {
              const proAllowed = (() => {
                try {
                  const s = getAllowedExtForPlan("pro");
                  return Boolean(s && ext && s.has(ext));
                } catch {
                  return false;
                }
              })();
              const upgradeHint =
                planKey === "basic" && proAllowed
                  ? (isArabic() ? "متاحة فقط في Pro و Business." : "Available on Pro & Business only.")
                  : planKey === "basic" || planKey === "pro"
                    ? (isArabic() ? "متاحة فقط في Business." : "Available on Business only.")
                    : "";

              return isArabic()
                ? ("صيغة ." + extLabel + " غير مسموحة في باقتك (" + planName + ")." + (upgradeHint ? (" " + upgradeHint) : ""))
                : ("." + extLabel + " is not allowed on your plan (" + planName + ")." + (upgradeHint ? (" " + upgradeHint) : ""));
            }
            if (reason === "file_too_big") {
              return isArabic()
                ? ("حجم الملف (" + fmtBytes(size) + ") أكبر من حد باقة " + planName + " (" + fmtBytes(limits.maxFileBytes) + ")")
                : ("File size (" + fmtBytes(size) + ") exceeds " + planName + " limit (" + fmtBytes(limits.maxFileBytes) + ")");
            }
            if (reason === "storage_full") {
              return isArabic()
                ? ("لا توجد مساحة كافية في باقة " + planName + " — المتبقي: " + fmtBytes(remainBytes0))
                : ("Not enough storage on " + planName + " — remaining: " + fmtBytes(remainBytes0));
            }
            if (reason === "queue_full") {
              return isArabic()
                ? ("القائمة ممتلئة — الحد الأقصى لباقة " + planName + " هو " + String(maxFiles) + " ملف. احذف من الموجودين لإضافة ملفات جديدة.")
                : ("List is full — " + planName + " limit is " + String(maxFiles) + " files. Remove some to add more.");
            }
            return isArabic() ? "لم يتم رفع هذا الملف" : "This file was not uploaded";
          };

          const upgradeHintAll = "";

          const toastMsg =
            !toUpload.length && rejected.length
              ? (rejected.length === 1 ? buildSingleRejectToast(rejected[0]) : (summaryMsg + (upgradeHintAll ? (isArabic() ? " — " + upgradeHintAll : " — " + upgradeHintAll) : "")))
              : summaryMsg;

          state.uploadError = rejected.length ? toastMsg : "";
          if (state.uploadError) {
            const title = !toUpload.length && rejected.length
              ? (isArabic() ? "تعذّر الرفع" : "Upload blocked")
              : (isArabic() ? "تنبيه" : "Warning");
            toastWarn(state.uploadError, title);
          }

          if (!toUpload.length) {
            render();
            return;
          }

          state.uploading = true;
          const nextUploads = Array.isArray(state.uploads) ? state.uploads : [];
          const newRecs = [];

          for (let i = 0; i < toUpload.length; i += 1) {
            const f = toUpload[i];
            const id = String(Date.now()) + "_" + String(Math.random()).slice(2) + "_" + String(i);
            const rec = {
              id,
              name: String((f && f.name) || ""),
              size: Number((f && f.size) || 0) || 0,
              status: "queued",
              error: "",
              url: "",
              progress: 0,
              loaded: 0,
              total: Number((f && f.size) || 0) || 0,
              file: f
            };
            nextUploads.push(rec);
            newRecs.push(rec);
          }

          let rejectedAdded = 0;
          for (let i = 0; i < rejected.length; i += 1) {
            const f = rejected[i] && rejected[i].file ? rejected[i].file : null;
            if (!f) continue;
            const name = String((f && f.name) || "");
            const size = Number((f && f.size) || 0) || 0;
            const ext = normalizeFilenameExt(name);
            const reason = String(rejected[i] && rejected[i].reason) || "";
            const errMsg = buildSingleRejectToast(rejected[i]);
            const id = String(Date.now()) + "_" + String(Math.random()).slice(2) + "_rej_" + String(i);

            if (reason === "queue_full") continue;

            nextUploads.push({
              id,
              name,
              size,
              status: "rejected",
              error: errMsg,
              url: "",
              progress: 0,
              loaded: 0,
              total: size,
              file: null
            });
            rejectedAdded += 1;
          }

          state.uploads = nextUploads;
          render();

          const uploadCount = newRecs.length;
          if (!uploadCount) {
            state.uploading = false;
            render();
            return;
          }

          const toastId = toastLoading(
            isArabic()
              ? ("جاري رفع " + String(uploadCount) + " ملف...")
              : ("Uploading " + String(uploadCount) + " files...")
          );
          let errToastBudget = 3;
          let uploadIndex = 0;
          for (let i = 0; i < newRecs.length; i += 1) {
            const rec = newRecs[i];
            const file = rec && rec.file ? rec.file : null;
            if (!file) continue;
            uploadIndex += 1;
            try {
              toastUpdate(toastId, {
                title: isArabic() ? "جاري الرفع" : "Uploading",
                message: isArabic()
                  ? ("ملف " + String(uploadIndex) + " / " + String(uploadCount) + (file && file.name ? " — " + String(file.name || "") : ""))
                  : ("File " + String(uploadIndex) + " / " + String(uploadCount) + (file && file.name ? " — " + String(file.name || "") : ""))
              });
              rec.status = "uploading";
              rec.error = "";
              rec.url = "";
              rec.progress = 0;
              rec.loaded = 0;
              rec.total = Number(file.size || rec.size || 0) || 0;
              render();
              const rt = guessResourceType(file);
              const sign = await getSignature(rt, file);
              const uploaded = await uploadToCloudinary(file, sign, (pct, loaded, total) => {
                try {
                  rec.progress = Number.isFinite(pct) ? pct : rec.progress;
                  rec.loaded = Number.isFinite(loaded) ? loaded : rec.loaded;
                  rec.total = Number.isFinite(total) ? total : rec.total;
                  render();
                } catch {}
              });
              const saved = await recordAsset(uploaded);
              try {
                clearMediaApiCache();
              } catch {}
              const savedAsset = saved && typeof saved === "object" ? saved.asset : null;
              const delivery = buildDeliveryUrlFromItem(savedAsset || { storeId: merchantId, publicId: uploaded && uploaded.public_id });
              rec.url = delivery || String((uploaded && (uploaded.secure_url || uploaded.url)) || "");
              rec.status = "done";
              rec.file = null;
              render();
            } catch (e) {
              rec.status = "error";
              rec.error = friendlyApiErrorMessage(e);
              rec.file = null;
              render();
              if (errToastBudget > 0) {
                errToastBudget -= 1;
                toastError(rec.error, (isArabic() ? "فشل رفع الملف" : "Upload failed") + (file && file.name ? ": " + String(file.name || "") : ""));
              }
            }
          }

          state.uploading = false;
          render();
          toastClose(toastId);
          try {
            const ok = newRecs.filter((x) => x && String(x.status || "") === "done").length;
            const failed = newRecs.filter((x) => x && String(x.status || "") === "error").length + rejectedAdded;
            if (!failed) toastSuccess(isArabic() ? ("تم رفع " + String(ok) + " ملف") : ("Uploaded " + String(ok) + " files"));
            else toastWarn(isArabic() ? ("اكتمل الرفع مع أخطاء (" + String(ok) + " ناجح / " + String(failed) + " فشل)") : ("Upload finished with errors (" + String(ok) + " ok / " + String(failed) + " failed)"));
          } catch {}
          state.type = state.type || "";
          state.page = 1;
          state.items = [];
          state.total = 0;
          state.error = "";
          render();
          try {
            refreshDashboard();
          } catch {}
          fetchAndRender();
        };

        input.onchange = () => {
          try {
            const fs = input.files ? Array.from(input.files) : [];
            input.value = "";
            if (!fs.length) return;
            runUploads(fs);
          } catch {}
        };

        convertInput.onchange = () => {
          try {
            const fs = convertInput.files ? Array.from(convertInput.files) : [];
            convertInput.value = "";
            if (!fs.length) return;
            setConvertFiles(fs);
          } catch {}
        };

        compressInput.onchange = () => {
          try {
            const fs = compressInput.files ? Array.from(compressInput.files) : [];
            compressInput.value = "";
            if (!fs.length) return;
            setCompressFiles(fs);
          } catch {}
        };

        document.body.appendChild(sheet.overlay);
        render();
        refreshDashboard();
      } catch (e) {
        warn("media platform open failed", e);
        try {
          if (sheetEl) sheetEl.remove();
        } catch {}
        sheetEl = null;
      }
    };

    try {
      if (isModalMount || !!themeTarget) mountRoot.__mounted = true;
    } catch {}
    mountRoot.appendChild(fab);
  } catch (e) {
    warn("media platform mount failed", e);
  }
};
`,
  `try { mount(); } catch {}\n`,
  `})();\n`
];
