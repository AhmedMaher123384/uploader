module.exports = [
  `
const renderThumbActions = (opts) => {
  const uOpen = String((opts && (opts.openUrl || opts.url)) || "");
  if (!uOpen) return null;
  const uCopy = String((opts && (opts.copyUrl || uOpen)) || "");
  const uDownload = String((opts && (opts.downloadUrl || uOpen)) || "");

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.gap = "6px";
  wrap.style.rowGap = "6px";
  wrap.style.flexWrap = "wrap";
  wrap.style.width = "100%";

  const getSallaIconClass = (key, candidates) => {
    try {
      if (!window.__bundleAppSallaIconCache) window.__bundleAppSallaIconCache = new Map();
    } catch {}
    const cache = (() => {
      try {
        return window.__bundleAppSallaIconCache;
      } catch {
        return null;
      }
    })();
    const k = String(key || "").trim();
    if (cache && k && cache.has(k)) return String(cache.get(k) || "").trim();

    const list = Array.isArray(candidates) ? candidates : [];
    const fallback = list.length ? String(list[0] || "").trim() : "";
    let chosen = fallback;

    try {
      if (!window.getComputedStyle) throw new Error("no getComputedStyle");
      const probe = document.createElement("i");
      probe.style.position = "fixed";
      probe.style.left = "-9999px";
      probe.style.top = "-9999px";
      probe.style.visibility = "hidden";
      document.body.appendChild(probe);
      for (let i = 0; i < list.length; i += 1) {
        const cls = String(list[i] || "").trim();
        if (!cls) continue;
        probe.className = cls;
        const c = window.getComputedStyle(probe, "::before").content;
        const s = String(c || "").trim();
        if (s && s !== "none" && s !== '""' && s !== "''") {
          chosen = cls;
          break;
        }
      }
      try {
        probe.remove();
      } catch {}
    } catch {}

    try {
      if (cache && k) cache.set(k, chosen);
    } catch {}
    return chosen;
  };

  const mkSallaIcon = (key, candidates) => {
    const i = document.createElement("i");
    i.className = getSallaIconClass(key, candidates);
    i.setAttribute("aria-hidden", "true");
    i.style.display = "block";
    i.style.fontSize = "18px";
    i.style.lineHeight = "1";
    i.style.pointerEvents = "none";
    return i;
  };

  const mkBtnBase = (el, label, tone) => {
    const vw = (() => {
      try {
        return Number(window.innerWidth || 0) || 0;
      } catch {
        return 0;
      }
    })();
    const size = vw && vw < 520 ? 32 : 36;
    el.title = String(label || "");
    el.style.display = "inline-flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.width = String(size) + "px";
    el.style.height = String(size) + "px";
    el.style.borderRadius = "12px";
    el.style.cursor = "pointer";
    el.style.flex = "0 0 auto";
    el.style.padding = "0";
    el.style.fontSize = "18px";
    el.style.lineHeight = "1";
    if (tone === "brand") {
      el.style.border = "1px solid rgba(24,181,213,.45)";
      el.style.background = "#18b5d5";
      el.style.color = "#0b1220";
      return;
    }
    if (tone === "danger") {
      el.style.border = "1px solid rgba(239,68,68,.55)";
      el.style.background = "#ef4444";
      el.style.color = "#0b1220";
      return;
    }
    el.style.border = "1px solid rgba(255,255,255,.12)";
    el.style.background = "#303030";
    el.style.color = "#fff";
  };

  const wireHover = (el) => {
    try {} catch {}
  };

  const open = document.createElement("a");
  open.href = uOpen;
  open.target = "_blank";
  open.rel = "noopener";
  open.style.textDecoration = "none";
  mkBtnBase(open, isArabic() ? "فتح" : "Open", "neutral");
  open.appendChild(mkSallaIcon("open", ["sicon-vision", "sicon-eye", "sicon-view", "sicon-external-link", "sicon-link"]));
  wireHover(open);

  const copy = document.createElement("button");
  copy.type = "button";
  copy.style.border = "0";
  mkBtnBase(copy, isArabic() ? "نسخ" : "Copy", "brand");
  copy.appendChild(mkSallaIcon("copy", ["sicon-pages", "sicon-copy", "sicon-files", "sicon-duplicate", "sicon-copy-1"]));
  wireHover(copy);
  copy.onclick = () => {
    try {
      copyText(uCopy, () => {});
    } catch {}
  };

  const guessDownloadName = () => {
    try {
      const n = String((opts && opts.downloadName) || "").trim();
      if (n) return n;
    } catch {}
    try {
      const url = new URL(uDownload, window.location.origin);
      const parts = String(url.pathname || "")
        .split("/")
        .filter(Boolean);
      const last = parts.length ? String(parts[parts.length - 1] || "").trim() : "";
      if (last) return decodeURIComponent(last);
    } catch {}
    return "file";
  };

  const download = document.createElement("button");
  download.type = "button";
  download.style.border = "0";
  mkBtnBase(download, isArabic() ? "تحميل" : "Download", "neutral");
  download.appendChild(mkSallaIcon("download", ["sicon-download", "sicon-download-cloud", "sicon-download-alt", "sicon-arrow-down"]));
  wireHover(download);
  download.onclick = async () => {
    try {
      if (download.disabled) return;
      download.disabled = true;
      download.style.opacity = "0.65";
      const name = guessDownloadName();
      let href = "";
      try {
        const obj = await fetchMediaObjectUrl(uDownload);
        href = obj || "";
      } catch {
        href = "";
      }
      if (!href) href = uDownload;

      const a = document.createElement("a");
      a.href = href;
      a.download = String(name || "file");
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      try {
        a.remove();
      } catch {}
    } catch {
      try {
        window.open(uOpen, "_blank", "noopener");
      } catch {}
    } finally {
      try {
        download.disabled = false;
        download.style.opacity = "1";
      } catch {}
    }
  };

  const onDelete = opts && typeof opts.onDelete === "function" ? opts.onDelete : null;
  let del = null;
  if (onDelete) {
    del = document.createElement("button");
    del.type = "button";
    del.style.border = "0";
    mkBtnBase(del, isArabic() ? "حذف" : "Delete", "danger");
    del.appendChild(mkSallaIcon("trash", ["sicon-trash", "sicon-delete", "sicon-bin", "sicon-remove"]));
    del.disabled = Boolean(opts && opts.deleting);
    del.style.opacity = del.disabled ? "0.55" : "1";
    del.onclick = () => {
      try {
        if (del.disabled) return;
        onDelete();
      } catch {}
    };
    wireHover(del);
  }

  wrap.appendChild(open);
  wrap.appendChild(copy);
  wrap.appendChild(download);
  if (del) wrap.appendChild(del);
  return wrap;
};
`,
  `
const BLANK_IMG =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const fetchMediaObjectUrl = async (src) => {
  const u = String(src || "");
  if (!u) return "";
  try {
    if (!window.fetch || !window.URL || !URL.createObjectURL) return "";
  } catch {
    return "";
  }

  try {
    if (!window.__bundleAppMediaBlobCache) window.__bundleAppMediaBlobCache = new Map();
    if (!window.__bundleAppMediaBlobInFlight) window.__bundleAppMediaBlobInFlight = new Map();
    if (!window.__bundleAppMediaBlobUrls) window.__bundleAppMediaBlobUrls = new Set();
  } catch {}

  const cache = window.__bundleAppMediaBlobCache;
  const inFlight = window.__bundleAppMediaBlobInFlight;

  try {
    if (cache && cache.has(u)) return String(cache.get(u) || "");
  } catch {}

  try {
    if (inFlight && inFlight.has(u)) return await inFlight.get(u);
  } catch {}

  const p = (async () => {
    const r = await fetch(u, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store" });
    const b = await r.blob().catch(() => null);
    if (!r.ok) {
      throw new Error((b && b.type && b.type.indexOf("application/json") === 0) ? "Forbidden" : "HTTP " + String(r.status));
    }
    if (!b) throw new Error("Empty response");
    const obj = URL.createObjectURL(b);
    try {
      if (cache) cache.set(u, obj);
    } catch {}
    try {
      if (window.__bundleAppMediaBlobUrls) window.__bundleAppMediaBlobUrls.add(obj);
    } catch {}
    return obj;
  })();

  try {
    if (inFlight) inFlight.set(u, p);
  } catch {}

  try {
    return await p;
  } finally {
    try {
      if (inFlight) inFlight.delete(u);
    } catch {}
  }
};

const revokeMediaObjectUrls = () => {
  try {
    const urls = window.__bundleAppMediaBlobUrls;
    if (urls && urls.forEach) {
      urls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
    }
  } catch {}
  try {
    if (window.__bundleAppMediaBlobUrls && window.__bundleAppMediaBlobUrls.clear) window.__bundleAppMediaBlobUrls.clear();
  } catch {}
  try {
    if (window.__bundleAppMediaBlobCache && window.__bundleAppMediaBlobCache.clear) window.__bundleAppMediaBlobCache.clear();
  } catch {}
  try {
    if (window.__bundleAppMediaBlobInFlight && window.__bundleAppMediaBlobInFlight.clear) window.__bundleAppMediaBlobInFlight.clear();
  } catch {}
};
`,
  `
const renderGrid = (items, opts) => {
  const grid = document.createElement("div");
  grid.style.display = "grid";
  const minCol = (() => {
    try {
      const w = Number(window.innerWidth || 0) || 0;
      if (w && w < 420) return 150;
      if (w && w < 760) return 170;
      return 190;
    } catch {
      return 170;
    }
  })();
  grid.style.gridTemplateColumns = "repeat(auto-fit,minmax(" + String(minCol) + "px,1fr))";
  grid.style.gap = "12px";
  grid.style.alignItems = "stretch";
  grid.style.marginTop = "4px";

  for (let i = 0; i < items.length; i += 1) {
    const it = items[i] || {};
    const openUrl = String(it.deliveryUrl || it.secureUrl || it.url || "");
    const copyUrl = String(it.deliveryUrl || it.secureUrl || it.url || "");
    const src = openUrl;
    const onDelete =
      opts && typeof opts.onDeleteItem === "function"
        ? () => {
            try {
              opts.onDeleteItem(it);
            } catch {}
          }
        : null;
    const deletingId = String((opts && opts.deletingId) || "");
    const isDeleting = deletingId && deletingId === String(it.id || "");

    const card = document.createElement("div");
    card.style.border = "1px solid rgba(255,255,255,.10)";
    card.style.borderRadius = "16px";
    card.style.overflow = "hidden";
    card.style.background = "#373737";

    const media = document.createElement("div");
    media.style.width = "100%";
    media.style.aspectRatio = "4 / 3";
    media.style.background = "rgba(255,255,255,.04)";
    media.style.display = "flex";
    media.style.alignItems = "center";
    media.style.justifyContent = "center";
    media.style.overflow = "hidden";

    const rt = String(it.resourceType || "");
    if (rt === "video") {
      const v = document.createElement("video");
      v.controls = true;
      v.playsInline = true;
      v.preload = "metadata";
      v.src = src;
      v.style.width = "100%";
      v.style.height = "100%";
      v.style.objectFit = "contain";
      v.style.background = "#0b1220";
      media.appendChild(v);
    } else if (rt === "raw") {
      const box = document.createElement("div");
      box.style.width = "100%";
      box.style.height = "100%";
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.alignItems = "center";
      box.style.justifyContent = "center";
      box.style.gap = "10px";
      box.style.padding = "18px";

      const label = document.createElement("div");
      label.style.fontSize = "14px";
      label.style.fontWeight = "950";
      label.style.color = "#fff";
      label.style.textAlign = "center";
      label.style.wordBreak = "break-word";
      label.textContent = String(it.originalFilename || it.publicId || "FILE");

      const open = document.createElement("a");
      open.href = src || "#";
      open.target = "_blank";
      open.rel = "noopener";
      open.textContent = isArabic() ? "فتح الملف" : "Open file";
      open.style.display = "inline-flex";
      open.style.alignItems = "center";
      open.style.justifyContent = "center";
      open.style.padding = "10px 12px";
      open.style.borderRadius = "12px";
      open.style.border = "1px solid rgba(24,181,213,.35)";
      open.style.background = "rgba(24,181,213,.10)";
      open.style.color = "#18b5d5";
      open.style.fontWeight = "950";
      open.style.textDecoration = "none";
      open.style.pointerEvents = src ? "auto" : "none";
      open.style.opacity = src ? "1" : "0.6";

      box.appendChild(label);
      box.appendChild(open);
      media.appendChild(box);
    } else {
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = BLANK_IMG;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.padding = "8px";
      img.style.boxSizing = "border-box";
      media.appendChild(img);
      if (src) {
        fetchMediaObjectUrl(src)
          .then((obj) => {
            try {
              if (obj) img.src = obj;
            } catch {}
          })
          .catch(() => {
            try {
              img.src = src;
            } catch {}
          });
      }
    }

    const meta = document.createElement("div");
    meta.style.padding = "10px";
    meta.style.display = "flex";
    meta.style.flexDirection = "column";
    meta.style.gap = "8px";

    const top = document.createElement("div");
    top.style.display = "flex";
    top.style.alignItems = "center";
    top.style.justifyContent = "space-between";
    top.style.gap = "10px";

    const fileName = String(it.originalFilename || it.publicId || "").trim();
    const ext = (() => {
      try {
        const s = String(fileName || "").trim();
        const j = s.lastIndexOf(".");
        if (j <= 0 || j === s.length - 1) return "";
        return s.slice(j + 1).trim().toUpperCase();
      } catch {
        return "";
      }
    })();
    const fmt = (() => {
      try {
        const f = String(it.format || "").trim();
        return f ? f.toUpperCase() : "";
      } catch {
        return "";
      }
    })();

    const name = document.createElement("div");
    name.style.flex = "1 1 auto";
    name.style.minWidth = "0";
    name.style.fontSize = "13px";
    name.style.fontWeight = "950";
    name.style.color = "#fff";
    name.style.overflow = "hidden";
    name.style.textOverflow = "ellipsis";
    name.style.whiteSpace = "normal";
    name.style.wordBreak = "break-word";
    name.style.display = "-webkit-box";
    name.style.webkitBoxOrient = "vertical";
    name.style.webkitLineClamp = "2";
    name.style.lineHeight = "1.25";
    name.textContent = fileName;

    const badge = document.createElement("div");
    badge.style.flex = "0 0 auto";
    badge.style.fontSize = "11px";
    badge.style.fontWeight = "950";
    badge.style.padding = "5px 8px";
    badge.style.borderRadius = "999px";
    badge.style.border = "1px solid rgba(24,181,213,.35)";
    badge.style.background = "rgba(24,181,213,.10)";
    badge.style.color = "#18b5d5";
    badge.textContent = (() => {
      const rtKey = String(rt || "").trim().toLowerCase();
      if (fmt) return fmt;
      if (ext) return ext;
      if (rtKey === "image") return "IMG";
      if (rtKey === "video") return "VID";
      if (rtKey === "raw") return "FILE";
      return "FILE";
    })();

    top.appendChild(name);
    top.appendChild(badge);
    meta.appendChild(top);

    if (src) {
      const info = document.createElement("div");
      info.style.display = "flex";
      info.style.alignItems = "center";
      info.style.justifyContent = "space-between";
      info.style.gap = "8px";
      info.style.flexWrap = "wrap";

      const chip = (text) => {
        const c = document.createElement("div");
        c.style.display = "inline-flex";
        c.style.alignItems = "center";
        c.style.justifyContent = "center";
        c.style.padding = "4px 7px";
        c.style.borderRadius = "999px";
        c.style.border = "1px solid rgba(255,255,255,.10)";
        c.style.background = "rgba(255,255,255,.05)";
        c.style.color = "rgba(255,255,255,.72)";
        c.style.fontSize = "10px";
        c.style.fontWeight = "900";
        c.style.lineHeight = "1";
        c.style.letterSpacing = ".2px";
        c.textContent = String(text || "");
        return c;
      };

      if (it.bytes != null) {
        try {
          const b = fmtBytes(it.bytes);
          if (b) info.appendChild(chip(b));
        } catch {}
      }
      if (it.createdAt) {
        try {
          const d = fmtDateTime(it.createdAt);
          if (d) info.appendChild(chip(d));
        } catch {}
      }

      meta.appendChild(info);

      const actions = renderThumbActions({ openUrl, copyUrl, downloadUrl: openUrl, onDelete, deleting: isDeleting, downloadName: fileName });
      if (actions) meta.appendChild(actions);
    }

    card.appendChild(media);
    card.appendChild(meta);
    grid.appendChild(card);
  }

  return grid;
};

const renderPager = ({ page, total, limit, onPage, loading }) => {
  const p = Math.max(1, Number(page || 1) || 1);
  const l = Math.max(1, Number(limit || 12) || 12);
  const t = Math.max(0, Number(total || 0) || 0);
  const totalPages = Math.max(1, Math.ceil(t / l));
  if (totalPages <= 1) return null;

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.gap = "8px";
  wrap.style.flexWrap = "wrap";
  wrap.style.paddingTop = "6px";

  const mk = (label, active, disabled) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(label || "");
    b.disabled = Boolean(disabled);
    b.style.border = active ? "1px solid rgba(24,181,213,.55)" : "1px solid rgba(255,255,255,.10)";
    b.style.background = active ? "rgba(24,181,213,.18)" : "#373737";
    b.style.color = active ? "#18b5d5" : "#fff";
    b.style.padding = "8px 10px";
    b.style.borderRadius = "12px";
    b.style.fontSize = "12px";
    b.style.fontWeight = "950";
    b.style.cursor = disabled ? "not-allowed" : "pointer";
    b.style.opacity = disabled ? "0.6" : "1";
    return b;
  };

  const go = (next) => {
    try {
      if (loading) return;
      const n = Math.max(1, Math.min(totalPages, Number(next || 1) || 1));
      if (n === p) return;
      if (typeof onPage === "function") onPage(n);
    } catch {}
  };

  const prev = mk(isArabic() ? "السابق" : "Prev", false, loading || p <= 1);
  prev.onclick = () => go(p - 1);
  wrap.appendChild(prev);

  const maxBtns = 5;
  const half = Math.floor(maxBtns / 2);
  let start = Math.max(1, p - half);
  let end = Math.min(totalPages, start + maxBtns - 1);
  start = Math.max(1, end - maxBtns + 1);

  if (start > 1) {
    const first = mk("1", p === 1, loading);
    first.onclick = () => go(1);
    wrap.appendChild(first);
    if (start > 2) {
      const dots = document.createElement("div");
      dots.textContent = "…";
      dots.style.color = "rgba(255,255,255,.55)";
      dots.style.fontWeight = "900";
      wrap.appendChild(dots);
    }
  }

  for (let i = start; i <= end; i += 1) {
    const b = mk(String(i), i === p, loading);
    b.onclick = () => go(i);
    wrap.appendChild(b);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      const dots = document.createElement("div");
      dots.textContent = "…";
      dots.style.color = "rgba(255,255,255,.55)";
      dots.style.fontWeight = "900";
      wrap.appendChild(dots);
    }
    const last = mk(String(totalPages), p === totalPages, loading);
    last.onclick = () => go(totalPages);
    wrap.appendChild(last);
  }

  const next = mk(isArabic() ? "التالي" : "Next", false, loading || p >= totalPages);
  next.onclick = () => go(p + 1);
  wrap.appendChild(next);

  return wrap;
};
`
];
