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

  if (code === "FILE_TYPE_NOT_ALLOWED") return isArabic() ? "نوع الملف غير مسموح" : "File type is not allowed";

  if (code === "FILE_SIZE_LIMIT_EXCEEDED") {
    const maxBytes = Number(details && details.maxBytes) || 0;
    const maxText = maxBytes ? (isArabic() ? " (الحد " + fmtBytes(maxBytes) + ")" : " (max " + fmtBytes(maxBytes) + ")") : "";
    return (isArabic() ? "حجم الملف أكبر من المسموح" : "File is too large") + maxText;
  }

  if (code === "STORAGE_LIMIT_EXCEEDED") {
    const maxBytes = Number(details && details.maxBytes) || 0;
    const usedBytes = Number(details && details.usedBytes) || 0;
    const maxText = maxBytes ? (isArabic() ? " (" + fmtBytes(usedBytes) + " / " + fmtBytes(maxBytes) + ")" : " (" + fmtBytes(usedBytes) + " / " + fmtBytes(maxBytes) + ")") : "";
    return (isArabic() ? "تم تجاوز حد التخزين" : "Storage limit exceeded") + maxText;
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
const guessResourceType = (file) => {
  const t = String((file && file.type) || "").toLowerCase();
  if (t.indexOf("video/") === 0) return "video";
  if (t.indexOf("image/") === 0) return "image";
  const ext = getExt(file && file.name);
  if (["mp4", "webm", "mov", "avi", "m4v", "mkv"].indexOf(ext) >= 0) return "video";
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
    if (sc) return String(origin + "/cdn/" + encodeURIComponent(sc));
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
        xhr.open("PUT", url, true);
        const ct = String(c.contentType || (file && file.type) || "").trim();
        if (ct) xhr.setRequestHeader("Content-Type", ct);
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

      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.onabort = () => reject(new Error("Upload aborted"));
      xhr.onload = () => {
        try {
          emit(100, fileSize, fileSize);
        } catch {}

        const status = Number(xhr.status || 0) || 0;
        if (status < 200 || status >= 300) {
          reject(new Error("Upload failed"));
          return;
        }

        const key = String(c.key || (String(c.folder || "") + "/" + String(c.publicId || ""))).trim();
        const ext = getExt(file && file.name);
        resolve({
          __provider: "r2",
          r2_key: key,
          public_id: key,
          asset_id: null,
          resource_type: String(c.resourceType || guessResourceType(file) || "raw"),
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
        });
      };

      try {
        xhr.send(file);
      } catch {
        reject(new Error("Upload failed"));
      }
    });
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
    const shouldWaitForThemeSlot = isThemeEditor && !themeTarget;

    if (shouldWaitForThemeSlot) {
      startThemeSlotObserver(mount);
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
          btn.setAttribute("aria-label", isArabic() ? "منصة الرفع" : "Media platform");
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
          label.textContent = isArabic() ? "فتح منصة الرفع" : "Open media platform";
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
          convertFormat: "webp",
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
          compressFormat: "auto",
          compressSpeed: "balanced",
          compressQuality: "",
          compressRunning: false,
          compressOverallProgress: 0,
          compressError: "",
          compressItems: [],
          compressUploadingAny: false
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
            state.dashError = String((e && e.message) || e || "");
            render();
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
          try {
            await deleteAssetById(id);
            try {
              clearMediaApiCache();
            } catch {}
            state.deletingId = "";
            render();
            try {
              refreshDashboard(true);
            } catch {}
            fetchAndRender(true);
          } catch (e) {
            state.deletingId = "";
            state.error = String((e && e.message) || e || "");
            render();
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
          } else if (f === "mov") {
            candidates = [
              "video/quicktime",
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
          const qualityFactor = q == null ? 1.0 : 0.55 + (q / 100) * 0.9;

          const videoBitsPerSecond = Math.max(350_000, Math.round(base * speedFactor * qualityFactor));
          const audioBitsPerSecond = s === "small" ? 48_000 : s === "balanced" ? 80_000 : 96_000;
          return { videoBitsPerSecond, audioBitsPerSecond };
        };

        const convertVideoOnClient = async (file, opts, onProgress) => {
          const f = file || null;
          if (!f) throw new Error("Missing file");
          const format = String((opts && opts.format) || "webm").trim().toLowerCase();
          if (format !== "webm" && format !== "webm_local" && format !== "mp4" && format !== "mov") throw new Error("Unsupported format");

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
              if (format === "mov") throw new Error("MOV local conversion is not supported in this browser");
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
              video.playbackRate = sp === "fast" ? 4 : sp === "balanced" ? 2 : 1;
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

            recorder.start(250);

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

            const outType = String(mimeType || "").split(";")[0] || (format === "mp4" || format === "mov" ? "video/mp4" : "video/webm");
            const out = new Blob(chunks, { type: outType });
            if (!out || !out.size) throw new Error("Empty response");
            try {
              if (typeof onProgress === "function") onProgress(100);
            } catch {}
            const derivedFmt = outType.indexOf("mp4") >= 0 || outType.indexOf("quicktime") >= 0 ? "mp4" : "webm";
            const fmt = format === "mov" ? "mov" : derivedFmt;
            return { blob: out, format: fmt };
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
          const format = String((opts && opts.format) || (isVideo ? "mp4" : "auto")).trim().toLowerCase();
          const speed = String((opts && opts.speed) || "fast").trim().toLowerCase();
          const quality = (opts && opts.quality != null) ? Number(opts.quality) : null;
          const name = String((opts && opts.name) || (f && f.name) || "").trim();
          const preset = String((opts && opts.preset) || "").trim().toLowerCase();
          const width = (opts && opts.width != null) ? String(opts.width || "").trim() : "";
          const height = (opts && opts.height != null) ? String(opts.height || "").trim() : "";
          const mode = String((opts && opts.mode) || "").trim().toLowerCase();
          const position = String((opts && opts.position) || "").trim().toLowerCase();

          const url = buildUrl(isVideo ? "/api/proxy/tools/convert-video" : "/api/proxy/tools/convert", {
            format,
            speed,
            quality: quality != null && Number.isFinite(quality) ? String(Math.round(quality)) : "",
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
                reject(new Error(String((j && (j.message || j.error)) || t || ("HTTP " + String(status)))));
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

        const setConvertFiles = (files) => {
          const fs = Array.isArray(files) ? files : [];
          const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          const maxFiles = maxConvertFilesForPlan(planKey || "basic");
          if (!maxFiles) {
            state.convertError = isArabic() ? "ميزة التحويل متاحة في Pro و Business فقط" : "Conversion is available in Pro and Business only";
            render();
            return;
          }

          const kind = String(state.convertKind || "image") === "video" ? "video" : "image";
          const keep = [];
          for (let i = 0; i < fs.length; i += 1) {
            const f = fs[i];
            if (!f) continue;
            try {
              if (guessResourceType(f) === kind) keep.push(f);
            } catch {}
          }

          const chosen = keep.slice(0, maxFiles);
          state.convertFiles = chosen;
          state.convertFile = chosen[0] || null;
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
          try {
            if (convertObjUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(convertObjUrl);
          } catch {}
          convertObjUrl = "";

          if (!chosen.length && fs.length) {
            state.convertError = isArabic()
              ? kind === "video"
                ? "اختر فيديو فقط"
                : "اختر صور فقط"
              : kind === "video"
                ? "Please select videos only"
                : "Please select images only";
          } else if (keep.length > maxFiles) {
            state.convertError = isArabic()
              ? "تم اختيار أكثر من المسموح — سيتم أخذ أول " + String(maxFiles) + " ملف فقط"
              : "You selected more than allowed — only the first " + String(maxFiles) + " files will be used";
          } else {
            state.convertError = "";
          }

          render();
        };

        const runConvert = async () => {
          if (state.converting) return;

          const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          const maxFiles = maxConvertFilesForPlan(planKey || "basic");
          if (!maxFiles) {
            state.convertError = isArabic() ? "ميزة التحويل متاحة في Pro و Business فقط" : "Conversion is available in Pro and Business only";
            render();
            return;
          }

          const fs = Array.isArray(state.convertFiles) ? state.convertFiles : [];
          if (!fs.length) {
            state.convertError = isArabic() ? "اختر ملفات أولاً" : "Pick files first";
            render();
            return;
          }

          state.convertError = "";
          state.converting = true;
          state.convertProgress = 0;
          state.convertOverallProgress = 0;
          try {
            revokeConvertObjectUrls();
          } catch {}
          state.convertItems = [];
          render();

          const chosen = fs.slice(0, maxFiles);
          if (fs.length !== chosen.length) state.convertFiles = chosen;

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
          state.convertItems = items;
          render();

          const q = state.convertQuality ? Number(state.convertQuality) : null;
          for (let i = 0; i < items.length; i += 1) {
            const it = items[i];
            const f = it.file;
            if (!f) continue;
            it.status = "running";
            it.progress = 0;
            render();
            try {
              const isVideo = guessResourceType(f) === "video";
              const targetFmt = isVideo ? String(state.convertFormat || "mp4").trim().toLowerCase() : String(state.convertFormat || "").trim().toLowerCase();
              const out = isVideo
                ? await convertVideoOnClient(
                    f,
                    { format: targetFmt, speed: state.convertSpeed, quality: q, name: it.name },
                    (p) => {
                      try {
                        const pct = Math.max(0, Math.min(100, Number(p || 0) || 0));
                        it.progress = pct;
                        state.convertOverallProgress = Math.round(((i + pct / 100) / items.length) * 100);
                        render();
                      } catch {}
                    }
                  )
                : await convertOnBackend(
                    f,
                    {
                      format: state.convertFormat,
                      speed: state.convertSpeed,
                      quality: q,
                      name: it.name,
                      preset: String(state.convertPreset || "original"),
                      width: "",
                      height: "",
                      mode: "fit",
                      position: ""
                    },
                    (p) => {
                      try {
                        const pct = Math.max(0, Math.min(100, Number(p || 0) || 0));
                        it.progress = pct;
                        state.convertOverallProgress = Math.round(((i + pct / 100) / items.length) * 100);
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
              it.outFormat = String((out && out.format) || "").trim().toLowerCase();
              it.progress = 100;
              it.status = "done";
              state.convertOverallProgress = Math.round(((i + 1) / items.length) * 100);
              render();
            } catch (e) {
              it.status = "error";
              it.progress = 0;
              it.error = String((e && e.message) || e || "");
              state.convertOverallProgress = Math.round(((i + 1) / items.length) * 100);
              render();
            }
          }

          state.converting = false;
          state.convertOverallProgress = 100;
          render();
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
            return;
          }

          it.uploadError = "";
          it.uploading = true;
          it.uploadProgress = 0;
          render();

          try {
            const raw = String((it.file && it.file.name) || it.name || "converted");
            let baseName = raw;
            const dot = baseName.lastIndexOf(".");
            if (dot > 0) baseName = baseName.slice(0, dot);
            baseName = baseName.slice(0, 120) || "converted";

            const rf = String(it.outFormat || "").trim().toLowerCase();
            const fmt = String(state.convertFormat || "").trim().toLowerCase();
            const ext =
              (rf ? rf : "") ||
              (fmt === "mp4"
                ? "mp4"
                : fmt === "mov"
                  ? "mov"
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
                : ext === "mov"
                  ? "video/quicktime"
                  : ext === "webm"
                    ? "video/webm"
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
          } catch (e) {
            it.uploading = false;
            it.uploadProgress = 0;
            it.uploadError = friendlyApiErrorMessage(e);
            render();
          }
        };

        const openFilesFromConvert = async () => {
          try {
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
            state.convertFormat = "webp";
            state.convertPreset = "original";
          }
          state.convertFile = null;
          state.convertFiles = [];
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
          const maxFiles = maxCompressFilesForPlan(planKey || "basic");
          const chosen = imgs.slice(0, maxFiles);
          state.compressFiles = chosen;
          state.compressItems = [];
          state.compressRunning = false;
          state.compressOverallProgress = 0;
          state.compressUploadingAny = false;
          if (!chosen.length && fs.length) {
            state.compressError = isArabic() ? "اختر صور فقط" : "Please select images only";
          } else if (imgs.length > maxFiles) {
            state.compressError = isArabic()
              ? "تم اختيار أكثر من المسموح — سيتم أخذ أول " + String(maxFiles) + " صورة فقط"
              : "You selected more than allowed — only the first " + String(maxFiles) + " images will be used";
          } else {
            state.compressError = "";
          }
          render();
        };

        const compressOnBackend = async (file, opts, onProgress) => {
          if (isSandbox) throw new Error("Sandbox mode: compress disabled");
          const f = file || null;
          if (!f) throw new Error("Missing file");
          const format = String((opts && opts.format) || "webp").trim().toLowerCase();
          const speed = String((opts && opts.speed) || "balanced").trim().toLowerCase();
          const quality = opts && opts.quality != null ? Number(opts.quality) : null;
          const name = String((opts && opts.name) || (f && f.name) || "").trim();

          const url = buildUrl("/api/proxy/tools/compress", {
            format,
            speed,
            quality: quality != null && Number.isFinite(quality) ? String(Math.round(quality)) : "",
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
          const fs = Array.isArray(state.compressFiles) ? state.compressFiles : [];
          if (!fs.length) return;

          state.compressError = "";
          state.compressItems = [];
          state.compressRunning = true;
          state.compressOverallProgress = 0;
          state.compressUploadingAny = false;
          render();

          const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          const maxFiles = maxCompressFilesForPlan(planKey || "basic");
          const chosen = fs.slice(0, maxFiles);
          if (fs.length !== chosen.length) state.compressFiles = chosen;

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

          const q = state.compressQuality ? Number(state.compressQuality) : null;
          const format = String(state.compressFormat || "webp").trim().toLowerCase();
          const speed = String(state.compressSpeed || "balanced").trim().toLowerCase();

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
                { format, speed, quality: q, name: it.name },
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
              it.outFormat = String((out && out.format) || "").trim().toLowerCase();
              it.progress = 100;
              it.status = "done";
              state.compressOverallProgress = Math.round(((i + 1) / items.length) * 100);
              render();
            } catch (e) {
              it.status = "error";
              it.progress = 0;
              it.error = String((e && e.message) || e || "");
              state.compressOverallProgress = Math.round(((i + 1) / items.length) * 100);
              render();
            }
          }

          state.compressRunning = false;
          state.compressOverallProgress = 100;
          render();
        };

        const uploadCompressedById = async (id) => {
          const targetId = String(id || "").trim();
          if (!targetId) return;
          const items = Array.isArray(state.compressItems) ? state.compressItems : [];
          const it = items.find((x) => x && String(x.id || "") === targetId) || null;
          if (!it || it.uploading || it.uploadUrl || !it.resultUrl) return;
          if (isSandbox) {
            it.uploadError = isArabic() ? "وضع Sandbox: الرفع غير متاح" : "Sandbox mode: upload disabled";
            render();
            return;
          }

          it.uploadError = "";
          it.uploading = true;
          it.uploadProgress = 0;
          state.compressUploadingAny = true;
          render();

          try {
            const raw = String(it.name || "compressed");
            let baseName = raw;
            const dot = baseName.lastIndexOf(".");
            if (dot > 0) baseName = baseName.slice(0, dot);
            baseName = baseName.slice(0, 120) || "compressed";

            const ext = String(it.outFormat || "").trim().toLowerCase() || "webp";
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
          } catch (e) {
            it.uploading = false;
            it.uploadProgress = 0;
            it.uploadError = friendlyApiErrorMessage(e);
            state.compressUploadingAny = items.some((x) => x && x.uploading);
            render();
          }
        };

        const openFilesFromCompress = async () => {
          try {
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
            sheet.uploads.innerHTML = "";
            sheet.content.innerHTML = "";

            const labels = isArabic()
              ? { upload: "مركز الرفع", compress: "ضغط الصور", convert: "منصة التحويل", files: "ملفاتي", all: "الكل", img: "صور", vid: "فيديو", ref: "تحديث" }
              : { upload: "Upload Center", compress: "Compression", convert: "Conversion Platform", files: "My files", all: "All", img: "Images", vid: "Videos", ref: "Refresh" };

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

            const refreshBtn = btnGhost(labels.ref);
            refreshBtn.onclick = () => {
              try {
                clearMediaApiCache();
              } catch {}
              try {
                refreshDashboard(true);
              } catch {}
              try {
                if (state.view === "files") fetchAndRender(true);
              } catch {}
            };
            sheet.actions.appendChild(refreshBtn);

            if (state.view === "upload" && state.uploads.length) {
              sheet.uploads.style.display = "flex";
              for (let i = 0; i < state.uploads.length; i += 1) {
                sheet.uploads.appendChild(renderUploadRow(state.uploads[i]));
              }
            } else {
              sheet.uploads.style.display = "none";
            }

            if (state.view === "upload") {
              if (state.dashLoading) sheet.content.appendChild(renderLoading());
              if (state.dashError) sheet.content.appendChild(renderError(state.dashError));
            if (!state.dashLoading && !state.dashError) {
              const maxFiles = maxUploadFilesForPlan(planKey || "basic");
              try {
                input.multiple = maxFiles > 1;
              } catch {}
              sheet.content.appendChild(renderUploadHero(state.dash));
              sheet.content.appendChild(renderSmartStats(state.dash));
              sheet.content.appendChild(
                renderDropzone({
                  disabled: state.uploading,
                  onPick: () => {
                    try {
                      input.click();
                    } catch {}
                  },
                  onFiles: (fs) => runUploads(fs)
                })
              );
              if (state.uploadError) sheet.content.appendChild(renderError(state.uploadError));
            }
            return;
          }

            if (state.view === "compress") {
              if (state.dashLoading) sheet.content.appendChild(renderLoading());
              if (state.dashError) sheet.content.appendChild(renderError(state.dashError));
              if (!state.dashLoading && !state.dashError) {
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
              return;
            }

            if (state.view === "convert") {
              if (state.dashLoading) sheet.content.appendChild(renderLoading());
              if (state.dashError) sheet.content.appendChild(renderError(state.dashError));
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
                onOpenFiles: openFilesFromConvert,
                onSetConvertFiles: setConvertFiles,
                onSetKind: setConvertKind,
                onReset: resetConvert
              });
              if (card) sheet.content.appendChild(card);
              return;
            }

            const allBtn = pill(labels.all, state.type === "");
            const imgBtn = pill(labels.img, state.type === "image");
            const vidBtn = pill(labels.vid, state.type === "video");

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
            typeRow.style.gap = "8px";
            typeRow.style.flexWrap = "wrap";
            typeRow.appendChild(allBtn);
            typeRow.appendChild(imgBtn);
            typeRow.appendChild(vidBtn);
            sheet.content.appendChild(typeRow);

            if (state.loading) sheet.content.appendChild(renderLoading());
            if (state.error) sheet.content.appendChild(renderError(state.error));

            if (!state.loading && !state.error) {
              if (!state.items.length) sheet.content.appendChild(renderEmpty());
              else sheet.content.appendChild(renderGrid(state.items, { deletingId: state.deletingId, onDeleteItem }));

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
            state.error = String((err && err.message) || err || "");
            render();
          }
        };

        const runUploads = async (files) => {
          if (state.uploading) return;
          const fs0 = Array.isArray(files) ? files : [];
          const planKey = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          const maxFiles = maxUploadFilesForPlan(planKey || "basic");
          const chosen = fs0.slice(0, maxFiles);
          if (fs0.length > chosen.length) {
            state.uploadError = isArabic()
              ? "تم اختيار أكثر من المسموح — سيتم رفع أول " + String(maxFiles) + " ملف فقط"
              : "You selected more than allowed — only the first " + String(maxFiles) + " files will be uploaded";
          } else {
            state.uploadError = "";
          }
          state.uploading = true;
          state.uploads = [];

          for (let i = 0; i < chosen.length; i += 1) {
            const f = chosen[i];
            if (!f) continue;
            state.uploads.push({
              name: String(f.name || ""),
              size: Number(f.size || 0) || 0,
              status: "queued",
              error: "",
              url: "",
              progress: 0,
              loaded: 0,
              total: Number(f.size || 0) || 0
            });
          }

          render();

          for (let i = 0; i < chosen.length; i += 1) {
            const file = chosen[i];
            if (!file) continue;
            const rec = state.uploads[i];
            try {
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
              render();
            } catch (e) {
              rec.status = "error";
              rec.error = friendlyApiErrorMessage(e);
              render();
            }
          }

          state.uploading = false;
          render();
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
