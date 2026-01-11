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
const loadAssets = async (resourceType, page, limit) => {
  const url = buildUrl("/api/proxy/media/assets", { resourceType: resourceType || "", page: page || 1, limit: limit || 24 });
  if (!url) throw new Error("Missing backend origin");
  return await fetchJson(url);
};
`,
  `
const loadDashboard = async () => {
  const url = buildUrl("/api/proxy/media/dashboard", {});
  if (!url) throw new Error("Missing backend origin");
  return await fetchJson(url);
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
    if (token) u.searchParams.set("token", token);
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
const uploadToCloudinary = async (file, sign) => {
  if (isSandbox) throw new Error("Sandbox mode: upload disabled");
  const c = sign && sign.cloudinary ? sign.cloudinary : null;
  if (!c || !c.uploadUrl || !c.apiKey || !c.signature || !c.timestamp || !c.folder || !c.publicId) throw new Error("Invalid signature");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", String(c.apiKey));
  fd.append("timestamp", String(c.timestamp));
  fd.append("signature", String(c.signature));
  fd.append("folder", String(c.folder));
  fd.append("public_id", String(c.publicId));
  if (c.tags) fd.append("tags", String(c.tags));
  if (c.context) fd.append("context", String(c.context));

  const r = await fetch(String(c.uploadUrl), { method: "POST", body: fd });
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = (j && j.error && j.error.message) || "Upload failed";
    throw new Error(msg);
  }
  return j;
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

        const close = () => {
          try {
            if (typeof revokeMediaObjectUrls === "function") revokeMediaObjectUrls();
          } catch {}
          try {
            if (sheetEl) sheetEl.remove();
          } catch {}
          try {
            if (input && input.remove) input.remove();
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
          uploading: false
        };

        const refreshDashboard = async () => {
          if (state.dashLoading) return;
          state.dashLoading = true;
          state.dashError = "";
          render();
          try {
            const d = await loadDashboard();
            state.dash = d && typeof d === "object" ? d : null;
            state.dashLoading = false;
            render();
          } catch (e) {
            state.dashLoading = false;
            state.dashError = String((e && e.message) || e || "");
            render();
          }
        };

        const render = () => {
          try {
            sheet.tabs.innerHTML = "";
            sheet.actions.innerHTML = "";
            sheet.uploads.innerHTML = "";
            sheet.content.innerHTML = "";

            const labels = isArabic()
              ? { upload: "مركز الرفع", files: "ملفاتي", all: "الكل", img: "صور", vid: "فيديو", ref: "تحديث" }
              : { upload: "Upload Center", files: "My files", all: "All", img: "Images", vid: "Videos", ref: "Refresh" };

            const uploadTab = pill(labels.upload, state.view === "upload");
            const filesTab = pill(labels.files, state.view === "files");

            const setView = (v) => {
              const next = String(v || "");
              if (!next || next === state.view) return;
              state.view = next;
              state.error = "";
              render();
              if (state.view === "files") fetchAndRender();
              if (state.view === "upload") refreshDashboard();
            };

            uploadTab.onclick = () => setView("upload");
            filesTab.onclick = () => setView("files");
            sheet.tabs.appendChild(uploadTab);
            sheet.tabs.appendChild(filesTab);

            const refreshBtn = btnGhost(labels.ref);
            refreshBtn.onclick = () => {
              try {
                refreshDashboard();
              } catch {}
              try {
                if (state.view === "files") fetchAndRender();
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
              else sheet.content.appendChild(renderGrid(state.items));

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

        const fetchAndRender = async () => {
          if (state.loading) return;
          state.loading = true;
          render();
          try {
            const data = await loadAssets(state.type, state.page, state.limit);
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
            state.uploads.push({ name: String(f.name || ""), size: Number(f.size || 0) || 0, status: "queued", error: "", url: "" });
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
              render();
              const rt = guessResourceType(file);
              const sign = await getSignature(rt, file);
              const uploaded = await uploadToCloudinary(file, sign);
              await recordAsset(uploaded);
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
