const uiParts = require("./media.ui");

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

const getSandboxTarget = () => {
  try {
    return document.querySelector(sandboxSelector);
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
  if (ext === "mp4" || ext === "webm") return "video";
  if (["jpg", "jpeg", "png", "webp", "avif", "gif", "tif", "tiff", "svg", "bmp", "heic", "heif"].indexOf(ext) >= 0) return "image";
  return "raw";
};
`,
  `
const buildDeliveryUrlFromItem = (it) => {
  try {
    const origin = getBackendOrigin();
    if (!origin) return "";
    const storeId = String((it && (it.storeId || it.merchantId)) || "").trim();
    const publicId = String((it && it.publicId) || "").trim();
    if (!storeId || !publicId) return "";
    const parts = publicId.split("/").filter(Boolean);
    const leaf = parts.length ? String(parts[parts.length - 1] || "").trim() : "";
    if (!leaf) return "";
    const u = new URL(origin + "/api/m/" + encodeURIComponent(storeId) + "/" + encodeURIComponent(leaf));
    try {
      const t = String(token || "").trim();
      if (t) u.searchParams.set("token", t);
    } catch {}
    return u.toString();
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
  if (!c || !c.uploadUrl || !c.apiKey || !c.signature || !c.timestamp || !c.folder || !c.publicId) throw new Error("Invalid signature");

  const fileSize = Number((file && file.size) || 0) || 0;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", String(c.apiKey));
  fd.append("timestamp", String(c.timestamp));
  fd.append("signature", String(c.signature));
  fd.append("folder", String(c.folder));
  fd.append("public_id", String(c.publicId));
  if (c.tags) fd.append("tags", String(c.tags));
  if (c.context) fd.append("context", String(c.context));

  const url = String(c.uploadUrl);
  if (!url) throw new Error("Invalid upload url");

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
    if (isModalMount) {
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

    const fab = createFab();
    if (isModalMount) {
      try {
        fab.style.position = "relative";
        fab.style.top = "auto";
        fab.style.left = "auto";
        fab.style.right = "auto";
        fab.style.zIndex = "1";
        fab.style.width = "100%";
        fab.style.borderRadius = "14px";
        fab.style.padding = "12px 14px";
        fab.style.display = "flex";
        fab.style.justifyContent = "center";
        fab.style.gap = "10px";
      } catch {}
    }
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
        convertInput.multiple = false;
        convertInput.accept = "image/*";
        convertInput.style.display = "none";
        document.body.appendChild(convertInput);

        let convertObjUrl = "";

        const close = () => {
          try {
            if (convertObjUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(convertObjUrl);
          } catch {}
          try {
            if (typeof revokeMediaObjectUrls === "function") revokeMediaObjectUrls();
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
          deletingId: "",
          convertFile: null,
          convertFormat: "auto",
          convertSpeed: "fast",
          convertQuality: "",
          converting: false,
          convertProgress: 0,
          convertError: "",
          convertResultUrl: "",
          convertResultBytes: 0,
          convertResultFormat: ""
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
              panel.style.background = "#292929";
              panel.style.boxShadow = "0 18px 60px rgba(0,0,0,.45)";
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

        const convertOnBackend = async (file, opts, onProgress) => {
          if (isSandbox) throw new Error("Sandbox mode: convert disabled");
          const f = file || null;
          if (!f) throw new Error("Missing file");

          const format = String((opts && opts.format) || "auto").trim().toLowerCase();
          const speed = String((opts && opts.speed) || "fast").trim().toLowerCase();
          const quality = (opts && opts.quality != null) ? Number(opts.quality) : null;
          const name = String((opts && opts.name) || (f && f.name) || "").trim();

          const url = buildUrl("/api/proxy/tools/convert", {
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

        const runConvert = async (file) => {
          const f = file || null;
          if (!f) return;
          if (state.converting) return;

          const plan = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
          if (plan && plan !== "pro" && plan !== "business") {
            state.convertError = isArabic() ? "ميزة التحويل متاحة في Pro و Business فقط" : "Conversion is available in Pro and Business only";
            render();
            return;
          }

          state.convertFile = f;
          state.convertError = "";
          state.convertProgress = 0;
          state.converting = true;
          state.convertResultBytes = 0;
          state.convertResultFormat = "";
          try {
            if (convertObjUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(convertObjUrl);
          } catch {}
          convertObjUrl = "";
          state.convertResultUrl = "";
          render();

          try {
            const q = state.convertQuality ? Number(state.convertQuality) : null;
            const out = await convertOnBackend(
              f,
              { format: state.convertFormat, speed: state.convertSpeed, quality: q, name: f.name },
              (p) => {
                state.convertProgress = Number(p || 0) || 0;
                render();
              }
            );
            const b = out && out.blob ? out.blob : null;
            if (!b) throw new Error("Empty response");
            const obj = URL.createObjectURL(b);
            convertObjUrl = obj;
            state.convertResultUrl = obj;
            state.convertResultBytes = Number(b.size || 0) || 0;
            state.convertResultFormat = String(out.format || "").trim();
            state.converting = false;
            state.convertProgress = 100;
            render();
          } catch (e) {
            state.converting = false;
            state.convertProgress = 0;
            state.convertError = String((e && e.message) || e || "");
            render();
          }
        };

        const setConvertFile = (f) => {
          const file = f || null;
          if (!file) return;
          state.convertFile = file;
          state.convertError = "";
          state.convertProgress = 0;
          state.convertResultBytes = 0;
          state.convertResultFormat = "";
          try {
            if (convertObjUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(convertObjUrl);
          } catch {}
          convertObjUrl = "";
          state.convertResultUrl = "";
          render();
        };

        const render = () => {
          try {
            sheet.tabs.innerHTML = "";
            sheet.actions.innerHTML = "";
            sheet.uploads.innerHTML = "";
            sheet.content.innerHTML = "";

            const labels = isArabic()
              ? { upload: "مركز الرفع", convert: "تحويل الصور", files: "ملفاتي", all: "الكل", img: "صور", vid: "فيديو", ref: "تحديث" }
              : { upload: "Upload Center", convert: "Convert", files: "My files", all: "All", img: "Images", vid: "Videos", ref: "Refresh" };

            const uploadTab = pill(labels.upload, state.view === "upload");
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
              if (state.view === "convert") refreshDashboard();
            };

            uploadTab.onclick = () => setView("upload");
            convertTab.onclick = () => setView("convert");
            filesTab.onclick = () => setView("files");
            sheet.tabs.appendChild(uploadTab);
            sheet.tabs.appendChild(convertTab);
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
              }
              return;
            }

            if (state.view === "convert") {
              if (state.dashLoading) sheet.content.appendChild(renderLoading());
              if (state.dashError) sheet.content.appendChild(renderError(state.dashError));

              const plan = String((state.dash && state.dash.planKey) || "").trim().toLowerCase();
              const planBlocked = plan && plan !== "pro" && plan !== "business";

              const card = document.createElement("div");
              card.style.border = "1px solid rgba(255,255,255,.12)";
              card.style.borderRadius = "16px";
              card.style.background = "#292929";
              card.style.boxShadow = "0 18px 50px rgba(0,0,0,.28)";
              card.style.padding = "14px";
              card.style.display = "flex";
              card.style.flexDirection = "column";
              card.style.gap = "12px";

              const head = document.createElement("div");
              head.style.display = "flex";
              head.style.alignItems = "flex-start";
              head.style.justifyContent = "space-between";
              head.style.gap = "10px";

              const titleWrap = document.createElement("div");
              titleWrap.style.display = "flex";
              titleWrap.style.flexDirection = "column";
              titleWrap.style.gap = "6px";
              titleWrap.style.minWidth = "0";

              const title = document.createElement("div");
              title.style.color = "#fff";
              title.style.fontSize = "14px";
              title.style.fontWeight = "950";
              title.textContent = isArabic() ? "تحويل الصور إلى WebP/AVIF" : "Convert images to WebP/AVIF";

              const hint = document.createElement("div");
              hint.style.color = "rgba(255,255,255,.70)";
              hint.style.fontSize = "12px";
              hint.style.fontWeight = "900";
              hint.style.lineHeight = "1.6";
              hint.textContent = planBlocked
                ? (isArabic() ? "الميزة متاحة في Pro و Business فقط" : "Available in Pro and Business only")
                : (isArabic() ? "ارفع صورة، اختر الصيغة والجودة ثم حمّل النتيجة فورًا" : "Upload an image, pick format/quality, then download instantly");

              titleWrap.appendChild(title);
              titleWrap.appendChild(hint);

              const pickBtn = btnGhost(isArabic() ? "اختيار صورة" : "Pick image");
              pickBtn.disabled = Boolean(state.converting) || planBlocked;
              pickBtn.onclick = () => {
                try {
                  convertInput.click();
                } catch {}
              };

              head.appendChild(titleWrap);
              head.appendChild(pickBtn);
              card.appendChild(head);

              const fileRow = document.createElement("div");
              fileRow.style.display = "flex";
              fileRow.style.alignItems = "center";
              fileRow.style.justifyContent = "space-between";
              fileRow.style.gap = "10px";
              fileRow.style.flexWrap = "wrap";

              const fileMeta = document.createElement("div");
              fileMeta.style.display = "flex";
              fileMeta.style.flexDirection = "column";
              fileMeta.style.gap = "4px";
              fileMeta.style.minWidth = "0";

              const fileName = document.createElement("div");
              fileName.style.color = "#fff";
              fileName.style.fontSize = "13px";
              fileName.style.fontWeight = "950";
              fileName.style.overflow = "hidden";
              fileName.style.textOverflow = "ellipsis";
              fileName.style.whiteSpace = "nowrap";
              fileName.textContent = state.convertFile ? String(state.convertFile.name || "") : (isArabic() ? "لم يتم اختيار ملف" : "No file selected");

              const fileSize = document.createElement("div");
              fileSize.style.color = "rgba(255,255,255,.66)";
              fileSize.style.fontSize = "12px";
              fileSize.style.fontWeight = "900";
              fileSize.textContent = state.convertFile ? fmtBytes(Number(state.convertFile.size || 0) || 0) : "";

              fileMeta.appendChild(fileName);
              fileMeta.appendChild(fileSize);

              const formatRow = document.createElement("div");
              formatRow.style.display = "flex";
              formatRow.style.gap = "8px";
              formatRow.style.flexWrap = "wrap";
              formatRow.style.alignItems = "center";

              const fmtAuto = pill(isArabic() ? "تلقائي" : "Auto", state.convertFormat === "auto");
              const fmtWebp = pill("WebP", state.convertFormat === "webp");
              const fmtAvif = pill("AVIF", state.convertFormat === "avif");
              fmtAuto.disabled = Boolean(state.converting) || planBlocked;
              fmtWebp.disabled = Boolean(state.converting) || planBlocked;
              fmtAvif.disabled = Boolean(state.converting) || planBlocked;
              fmtAuto.onclick = () => {
                state.convertFormat = "auto";
                render();
              };
              fmtWebp.onclick = () => {
                state.convertFormat = "webp";
                render();
              };
              fmtAvif.onclick = () => {
                state.convertFormat = "avif";
                render();
              };

              formatRow.appendChild(fmtAuto);
              formatRow.appendChild(fmtWebp);
              formatRow.appendChild(fmtAvif);

              fileRow.appendChild(fileMeta);
              fileRow.appendChild(formatRow);
              card.appendChild(fileRow);

              const qWrap = document.createElement("div");
              qWrap.style.display = "flex";
              qWrap.style.flexDirection = "column";
              qWrap.style.gap = "8px";

              const qHead = document.createElement("div");
              qHead.style.display = "flex";
              qHead.style.alignItems = "center";
              qHead.style.justifyContent = "space-between";
              qHead.style.gap = "10px";

              const qLabel = document.createElement("div");
              qLabel.style.color = "rgba(255,255,255,.82)";
              qLabel.style.fontSize = "12px";
              qLabel.style.fontWeight = "950";
              qLabel.textContent = isArabic() ? "الجودة" : "Quality";

              const qVal = document.createElement("div");
              qVal.style.color = "#18b5d5";
              qVal.style.fontSize = "12px";
              qVal.style.fontWeight = "950";
              const qDefault = state.convertFormat === "avif" ? 55 : 82;
              const qNum = state.convertQuality ? Number(state.convertQuality) : qDefault;
              qVal.textContent = String(Math.max(1, Math.min(100, Math.round(Number(qNum) || qDefault))));

              qHead.appendChild(qLabel);
              qHead.appendChild(qVal);

              const range = document.createElement("input");
              range.type = "range";
              range.min = "40";
              range.max = "95";
              range.step = "1";
              range.value = String(qVal.textContent || qDefault);
              range.disabled = Boolean(state.converting) || planBlocked;
              range.oninput = () => {
                try {
                  state.convertQuality = String(range.value || "");
                  render();
                } catch {}
              };
              try {
                range.style.width = "100%";
              } catch {}

              qWrap.appendChild(qHead);
              qWrap.appendChild(range);
              card.appendChild(qWrap);

              const speedRow = document.createElement("div");
              speedRow.style.display = "flex";
              speedRow.style.gap = "8px";
              speedRow.style.flexWrap = "wrap";
              speedRow.style.alignItems = "center";

              const spFast = pill(isArabic() ? "سريع" : "Fast", state.convertSpeed === "fast");
              const spBal = pill(isArabic() ? "متوازن" : "Balanced", state.convertSpeed === "balanced");
              const spSmall = pill(isArabic() ? "أصغر حجم" : "Smallest", state.convertSpeed === "small");
              spFast.disabled = Boolean(state.converting) || planBlocked;
              spBal.disabled = Boolean(state.converting) || planBlocked;
              spSmall.disabled = Boolean(state.converting) || planBlocked;
              spFast.onclick = () => {
                state.convertSpeed = "fast";
                render();
              };
              spBal.onclick = () => {
                state.convertSpeed = "balanced";
                render();
              };
              spSmall.onclick = () => {
                state.convertSpeed = "small";
                render();
              };
              speedRow.appendChild(spFast);
              speedRow.appendChild(spBal);
              speedRow.appendChild(spSmall);
              card.appendChild(speedRow);

              const dz = renderDropzone({
                disabled: Boolean(state.converting) || planBlocked,
                onPick: () => {
                  try {
                    convertInput.click();
                  } catch {}
                },
                onFiles: (fs) => {
                  try {
                    const list = Array.isArray(fs) ? fs : [];
                    const f = list && list[0] ? list[0] : null;
                    if (f) setConvertFile(f);
                  } catch {}
                }
              });
              card.appendChild(dz);

              const actions = document.createElement("div");
              actions.style.display = "flex";
              actions.style.gap = "10px";
              actions.style.flexWrap = "wrap";

              const convertBtn = btnPrimary(isArabic() ? "تحويل الآن" : "Convert now");
              convertBtn.disabled = Boolean(state.converting) || planBlocked || !state.convertFile;
              convertBtn.onclick = () => runConvert(state.convertFile);

              const resetBtn = btnGhost(isArabic() ? "تفريغ" : "Reset");
              resetBtn.disabled = Boolean(state.converting) || planBlocked;
              resetBtn.onclick = () => {
                state.convertFile = null;
                state.convertError = "";
                state.convertQuality = "";
                state.convertProgress = 0;
                state.convertResultBytes = 0;
                state.convertResultFormat = "";
                try {
                  if (convertObjUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(convertObjUrl);
                } catch {}
                convertObjUrl = "";
                state.convertResultUrl = "";
                render();
              };

              actions.appendChild(convertBtn);
              actions.appendChild(resetBtn);
              card.appendChild(actions);

              if (state.converting) {
                const prog = document.createElement("div");
                prog.style.border = "1px solid rgba(255,255,255,.10)";
                prog.style.borderRadius = "14px";
                prog.style.background = "rgba(2,6,23,.28)";
                prog.style.overflow = "hidden";
                const bar = document.createElement("div");
                bar.style.height = "10px";
                bar.style.width = Math.max(0, Math.min(100, Number(state.convertProgress || 0) || 0)) + "%";
                bar.style.background = "linear-gradient(90deg,#18b5d5,rgba(24,181,213,.35))";
                bar.style.transition = "width .12s ease";
                prog.appendChild(bar);
                card.appendChild(prog);
              }

              if (state.convertError) {
                card.appendChild(renderError(state.convertError));
              }

              if (state.convertResultUrl) {
                const outWrap = document.createElement("div");
                outWrap.style.display = "flex";
                outWrap.style.flexDirection = "column";
                outWrap.style.gap = "10px";

                const outMeta = document.createElement("div");
                outMeta.style.display = "flex";
                outMeta.style.alignItems = "center";
                outMeta.style.justifyContent = "space-between";
                outMeta.style.gap = "10px";
                outMeta.style.flexWrap = "wrap";

                const outLeft = document.createElement("div");
                outLeft.style.display = "flex";
                outLeft.style.flexDirection = "column";
                outLeft.style.gap = "4px";

                const outTitle = document.createElement("div");
                outTitle.style.color = "#fff";
                outTitle.style.fontSize = "13px";
                outTitle.style.fontWeight = "950";
                outTitle.textContent = isArabic() ? "النتيجة جاهزة" : "Result is ready";

                const outHint = document.createElement("div");
                outHint.style.color = "rgba(255,255,255,.70)";
                outHint.style.fontSize = "12px";
                outHint.style.fontWeight = "900";
                const fmt = String(state.convertResultFormat || state.convertFormat || "").toUpperCase();
                outHint.textContent = (fmt ? fmt + " · " : "") + fmtBytes(state.convertResultBytes || 0);

                outLeft.appendChild(outTitle);
                outLeft.appendChild(outHint);

                const dl = btnPrimary(isArabic() ? "تحميل" : "Download");
                dl.onclick = () => {
                  try {
                    const a = document.createElement("a");
                    const raw = state.convertFile ? String(state.convertFile.name || "") : "converted";
                    let baseName = raw;
                    const dot = baseName.lastIndexOf(".");
                    if (dot > 0) baseName = baseName.slice(0, dot);
                    baseName = baseName.slice(0, 120) || "converted";
                    const ext = String(state.convertResultFormat || "").trim() || (state.convertFormat === "avif" ? "avif" : state.convertFormat === "webp" ? "webp" : "webp");
                    a.href = state.convertResultUrl;
                    a.download = baseName + "." + ext;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  } catch {}
                };

                outMeta.appendChild(outLeft);
                outMeta.appendChild(dl);

                const img = document.createElement("img");
                img.alt = "";
                img.loading = "lazy";
                img.decoding = "async";
                img.src = state.convertResultUrl;
                img.style.width = "100%";
                img.style.maxHeight = "260px";
                img.style.objectFit = "contain";
                img.style.borderRadius = "14px";
                img.style.border = "1px solid rgba(255,255,255,.10)";
                img.style.background = "rgba(2,6,23,.28)";

                outWrap.appendChild(outMeta);
                outWrap.appendChild(img);
                card.appendChild(outWrap);
              }

              sheet.content.appendChild(card);
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
          state.uploading = true;
          state.uploads = [];

          for (let i = 0; i < files.length; i += 1) {
            const f = files[i];
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

          for (let i = 0; i < files.length; i += 1) {
            const file = files[i];
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
              await recordAsset(uploaded);
              try {
                clearMediaApiCache();
              } catch {}
              const delivery = buildDeliveryUrlFromItem({ storeId: merchantId, publicId: uploaded && uploaded.public_id });
              rec.url = delivery || String((uploaded && (uploaded.secure_url || uploaded.url)) || "");
              rec.status = "done";
              render();
            } catch (e) {
              rec.status = "error";
              rec.error = String((e && e.message) || e || "Error");
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
            const f = convertInput.files && convertInput.files[0] ? convertInput.files[0] : null;
            convertInput.value = "";
            if (!f) return;
            setConvertFile(f);
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
      if (isModalMount) mountRoot.__mounted = true;
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
