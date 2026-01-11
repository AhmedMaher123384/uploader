module.exports = [
  `
const findFooterEl = () => {
  try {
    return (
      document.querySelector("footer") ||
      document.querySelector('[role="contentinfo"]') ||
      document.querySelector("#footer") ||
      document.querySelector(".footer") ||
      null
    );
  } catch {
    return null;
  }
};
`,
  `
const setFabVisible = (btn, on) => {
  try {
    btn.style.opacity = on ? "1" : "0";
    btn.style.pointerEvents = on ? "auto" : "none";
    btn.style.transform = on ? "translateY(0)" : "translateY(10px)";
  } catch {}
};
`,
  `
const setupFabFooterReveal = (btn) => {
  try {
    const footer = findFooterEl();
    if (!footer) {
      setFabVisible(btn, true);
      return;
    }

    const applyInView = (inView) => setFabVisible(btn, Boolean(inView));

    try {
      const io = new IntersectionObserver(
        (entries) => {
          try {
            const e = (entries && entries[0]) || null;
            applyInView(Boolean(e && e.isIntersecting && e.intersectionRatio > 0));
          } catch {}
        },
        { root: null, threshold: [0, 0.01, 0.1] }
      );
      io.observe(footer);

      setTimeout(() => {
        try {
          const r = footer.getBoundingClientRect();
          applyInView(r.top < window.innerHeight && r.bottom > 0);
        } catch {}
      }, 0);
    } catch {
      const check = () => {
        try {
          const r = footer.getBoundingClientRect();
          applyInView(r.top < window.innerHeight && r.bottom > 0);
        } catch {}
      };
      window.addEventListener("scroll", check, { passive: true });
      window.addEventListener("resize", check, { passive: true });
      setTimeout(check, 0);
    }
  } catch {
    try {
      setFabVisible(btn, true);
    } catch {}
  }
};
`,
  `
const createFab = () => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", isArabic() ? "منصة الرفع" : "Upload platform");
  btn.style.position = "fixed";
  btn.style.top = "calc(env(safe-area-inset-top, 0px) + 12px)";
  if (typeof isRtl === "function" && isRtl()) {
    btn.style.right = "12px";
  } else {
    btn.style.left = "12px";
  }
  btn.style.zIndex = "100002";
  btn.style.border = "1px solid rgba(24,181,213,.55)";
  btn.style.cursor = "pointer";
  btn.style.borderRadius = "999px";
  btn.style.background = "#292929";
  btn.style.color = "#fff";
  btn.style.boxShadow = "0 14px 34px rgba(0,0,0,.28)";
  btn.style.display = "grid";
  btn.style.placeItems = "center";
  btn.style.userSelect = "none";
  btn.style.webkitUserSelect = "none";
  btn.style.lineHeight = "1";
  btn.style.fontWeight = "900";
  btn.style.transition = "opacity .18s ease,transform .18s ease,filter .18s ease";
  btn.style.opacity = "1";
  btn.style.pointerEvents = "auto";
  btn.style.transform = "translateY(0)";

  btn.onmouseenter = () => {
    btn.style.filter = "brightness(1.05)";
  };
  btn.onmouseleave = () => {
    btn.style.filter = "";
  };

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.style.display = "block";
  icon.style.color = "#18b5d5";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute(
    "d",
    "M12 2l3.09 6.26 6.91 1.01-5 4.87 1.18 6.88L12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z"
  );
  icon.appendChild(path);
  btn.appendChild(icon);

  const applySize = () => {
    try {
      const vw = Math.min(Number(window.innerWidth || 0) || 0, Number(window.innerHeight || 0) || 0);
      const s = vw && vw < 380 ? 42 : 48;
      btn.style.width = \`\${s}px\`;
      btn.style.height = \`\${s}px\`;
      btn.style.padding = "0";
      const isSmall = s < 46;
      icon.setAttribute("width", isSmall ? "18" : "20");
      icon.setAttribute("height", isSmall ? "18" : "20");
    } catch {}
  };
  applySize();
  try {
    window.addEventListener("resize", applySize, { passive: true });
  } catch {}

  return btn;
};
`,
  `
const buildSheet = () => {
  const overlay = document.createElement("div");
  overlay.className = "bundle-app-bottomsheet";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "14px";
  overlay.style.zIndex = "100003";

  const panel = document.createElement("div");
  panel.className = "bundle-app-bottomsheet__panel";
  panel.style.width = "min(760px,100%)";
  panel.style.maxHeight = "85vh";
  panel.style.overflow = "auto";
  panel.style.background = "#292929";
  panel.style.borderRadius = "16px";
  panel.style.border = "1px solid rgba(24,181,213,.18)";
  panel.style.boxShadow = "0 22px 60px rgba(0,0,0,.45)";

  const head = document.createElement("div");
  head.className = "bundle-app-bottomsheet__head";
  head.style.padding = "16px 14px";
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.justifyContent = "space-between";
  head.style.borderBottom = "1px solid rgba(24,181,213,.2)";

  const title = document.createElement("div");
  title.className = "bundle-app-bottomsheet__title";
  title.textContent = isArabic() ? "منصة الرفع" : "Media platform";
  title.style.fontSize = "18px";
  title.style.fontWeight = "900";
  title.style.color = "#fff";

  const close = document.createElement("button");
  close.type = "button";
  close.textContent = isArabic() ? "إغلاق" : "Close";
  close.style.padding = "6px 10px";
  close.style.borderRadius = "10px";
  close.style.border = "1px solid rgba(24,181,213,.3)";
  close.style.background = "#292929";
  close.style.color = "#18b5d5";
  close.style.fontSize = "13px";
  close.style.fontWeight = "900";
  close.style.cursor = "pointer";

  head.appendChild(title);
  head.appendChild(close);

  const body = document.createElement("div");
  body.style.padding = "0 14px 14px";

  const topRow = document.createElement("div");
  topRow.style.display = "flex";
  topRow.style.alignItems = "center";
  topRow.style.justifyContent = "space-between";
  topRow.style.gap = "10px";
  topRow.style.flexWrap = "wrap";
  topRow.style.padding = "12px 0";

  const tabs = document.createElement("div");
  tabs.style.display = "flex";
  tabs.style.gap = "8px";
  tabs.style.flexWrap = "wrap";

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";
  actions.style.flexWrap = "wrap";

  topRow.appendChild(tabs);
  topRow.appendChild(actions);

  const uploads = document.createElement("div");
  uploads.style.display = "none";
  uploads.style.flexDirection = "column";
  uploads.style.gap = "8px";
  uploads.style.marginBottom = "10px";

  const content = document.createElement("div");
  content.style.display = "flex";
  content.style.flexDirection = "column";
  content.style.gap = "12px";

  body.appendChild(topRow);
  body.appendChild(uploads);
  body.appendChild(content);
  panel.appendChild(head);
  panel.appendChild(body);
  overlay.appendChild(panel);

  return { overlay, closeBtn: close, tabs, actions, uploads, content };
};
`,
  `
const pill = (label, active) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.border = active ? "1px solid rgba(24,181,213,.5)" : "1px solid rgba(255,255,255,.1)";
  b.style.background = active ? "#18b5d5" : "#292929";
  b.style.color = active ? "#292929" : "#fff";
  b.style.padding = "9px 12px";
  b.style.borderRadius = "999px";
  b.style.fontSize = "13px";
  b.style.fontWeight = "900";
  b.style.cursor = "pointer";
  b.style.boxShadow = active ? "0 14px 30px rgba(24,181,213,.3)" : "0 10px 24px rgba(0,0,0,.2)";
  return b;
};
`,
  `
const btnPrimary = (label) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.border = "0";
  b.style.cursor = "pointer";
  b.style.padding = "10px 12px";
  b.style.borderRadius = "12px";
  b.style.background = "#18b5d5";
  b.style.color = "#292929";
  b.style.fontWeight = "900";
  b.style.fontSize = "13px";
  b.style.boxShadow = "0 18px 40px rgba(24,181,213,.25)";
  return b;
};
`,
  `
const btnGhost = (label) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.border = "1px solid rgba(24,181,213,.3)";
  b.style.cursor = "pointer";
  b.style.padding = "10px 12px";
  b.style.borderRadius = "12px";
  b.style.background = "#292929";
  b.style.color = "#18b5d5";
  b.style.fontWeight = "900";
  b.style.fontSize = "13px";
  b.style.boxShadow = "0 10px 24px rgba(0,0,0,.2)";
  return b;
};
`,
  `
const fmtBytes = (n) => {
  const b = Number(n);
  if (!Number.isFinite(b) || b < 0) return "";
  if (b < 1024) return \`\${b} B\`;
  const kb = b / 1024;
  if (kb < 1024) return \`\${kb.toFixed(1)} KB\`;
  const mb = kb / 1024;
  if (mb < 1024) return \`\${mb.toFixed(1)} MB\`;
  const gb = mb / 1024;
  return \`\${gb.toFixed(2)} GB\`;
};
`,
  `
const fmtDateTime = (iso) => {
  const s = String(iso || "").trim();
  if (!s) return "";
  let d = null;
  try {
    d = new Date(s);
  } catch {
    d = null;
  }
  if (!d || Number.isNaN(d.getTime())) return s;
  try {
    return d.toLocaleString(isArabic() ? "ar" : undefined, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    try {
      return d.toISOString();
    } catch {
      return s;
    }
  }
};
`,
  `
const planLabel = (k) => {
  const key = String(k || "").trim().toLowerCase();
  if (key === "business") return "Business";
  if (key === "pro") return "Pro";
  return "Basic";
};
`,
  `
const renderUploadHero = (dash) => {
  const d = dash && typeof dash === "object" ? dash : {};
  const store = d.store && typeof d.store === "object" ? d.store : {};

  const sanitizeHttpUrl = (raw) => {
    const s0 = String(raw || "").trim();
    if (!s0) return "";
    const s1 = s0.replace(/[\\u0060"'<>]/g, "").trim();
    if (!s1) return "";
    const withProto = s1.indexOf("://") === -1 ? "https://" + s1 : s1;
    let u = null;
    try {
      u = new URL(withProto);
    } catch {
      u = null;
    }
    if (!u) return "";
    const proto = String(u.protocol || "").toLowerCase();
    if (proto !== "http:" && proto !== "https:") return "";
    return u.toString();
  };

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "space-between";
  wrap.style.gap = "12px";
  wrap.style.flexWrap = "wrap";
  wrap.style.padding = "14px";
  wrap.style.borderRadius = "16px";
  wrap.style.border = "1px solid rgba(24,181,213,.22)";
  wrap.style.background = "linear-gradient(135deg, rgba(24,181,213,.18), rgba(11,18,32,.60))";
  wrap.style.boxShadow = "0 18px 46px rgba(0,0,0,.25)";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "12px";
  left.style.minWidth = "0";

  const avatar = document.createElement("div");
  avatar.style.width = "44px";
  avatar.style.height = "44px";
  avatar.style.borderRadius = "14px";
  avatar.style.overflow = "hidden";
  avatar.style.flex = "0 0 auto";
  avatar.style.border = "1px solid rgba(255,255,255,.18)";
  avatar.style.background = "rgba(255,255,255,.06)";
  avatar.style.display = "grid";
  avatar.style.placeItems = "center";
  avatar.style.color = "#fff";
  avatar.style.fontWeight = "950";

  const logo = String(store.logoUrl || "").trim();
  if (logo) {
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    img.src = logo;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    avatar.appendChild(img);
  } else {
    const t = document.createElement("div");
    t.style.fontSize = "14px";
    t.textContent = "BA";
    avatar.appendChild(t);
  }

  const meta = document.createElement("div");
  meta.style.display = "flex";
  meta.style.flexDirection = "column";
  meta.style.gap = "4px";
  meta.style.minWidth = "0";

  const hello = document.createElement("div");
  hello.style.fontSize = "13px";
  hello.style.fontWeight = "900";
  hello.style.color = "rgba(255,255,255,.82)";
  hello.textContent = isArabic() ? "أهلاً بك في مركز الرفع" : "Welcome to Upload Center";

  const name = document.createElement("div");
  name.style.fontSize = "16px";
  name.style.fontWeight = "950";
  name.style.color = "#fff";
  name.style.overflow = "hidden";
  name.style.textOverflow = "ellipsis";
  name.style.whiteSpace = "nowrap";
  name.textContent = String(store.name || d.storeName || "") || (isArabic() ? "متجرك" : "Your store");

  const domain = document.createElement("div");
  domain.style.fontSize = "12px";
  domain.style.fontWeight = "900";
  domain.style.color = "rgba(24,181,213,.95)";
  domain.style.overflow = "hidden";
  domain.style.textOverflow = "ellipsis";
  domain.style.whiteSpace = "nowrap";
  domain.style.direction = "ltr";
  domain.textContent = String(store.domain || store.url || "") || "";

  meta.appendChild(hello);
  meta.appendChild(name);

  left.appendChild(avatar);
  left.appendChild(meta);

  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "10px";
  right.style.flexWrap = "wrap";
  right.style.justifyContent = "flex-end";

  const plan = document.createElement("div");
  plan.style.padding = "8px 12px";
  plan.style.borderRadius = "999px";
  plan.style.border = "1px solid rgba(24,181,213,.35)";
  plan.style.background = "rgba(24,181,213,.12)";
  plan.style.color = "#18b5d5";
  plan.style.fontWeight = "950";
  plan.style.fontSize = "12px";
  plan.textContent = (isArabic() ? "الباقة: " : "Plan: ") + planLabel(d.planKey);

  const visit = document.createElement("a");
  const rawUrl = String(store.url || d.storeUrl || store.domain || "").trim();
  const url = sanitizeHttpUrl(rawUrl);
  visit.href = url || "#";
  visit.target = "_blank";
  visit.rel = "noopener";
  visit.textContent = isArabic() ? "زيارة المتجر" : "Visit store";
  visit.style.display = "inline-flex";
  visit.style.alignItems = "center";
  visit.style.justifyContent = "center";
  visit.style.padding = "10px 12px";
  visit.style.borderRadius = "12px";
  visit.style.border = "1px solid rgba(255,255,255,.14)";
  visit.style.background = "rgba(255,255,255,.06)";
  visit.style.color = "#fff";
  visit.style.fontSize = "13px";
  visit.style.fontWeight = "950";
  visit.style.textDecoration = "none";
  visit.style.pointerEvents = url ? "auto" : "none";
  visit.style.opacity = url ? "1" : "0.6";
  visit.onclick = (e) => {
    try {
      if (!url) {
        e.preventDefault();
        e.stopPropagation();
      }
    } catch {}
  };

  right.appendChild(plan);
  right.appendChild(visit);

  wrap.appendChild(left);
  wrap.appendChild(right);
  return wrap;
};
`,
  `
const statCard = (label, value) => {
  const c = document.createElement("div");
  c.style.border = "1px solid rgba(24,181,213,.20)";
  c.style.borderRadius = "14px";
  c.style.background = "#292929";
  c.style.boxShadow = "0 10px 22px rgba(0,0,0,.14)";
  c.style.padding = "12px";
  c.style.display = "flex";
  c.style.flexDirection = "column";
  c.style.gap = "8px";

  const l = document.createElement("div");
  l.style.fontSize = "12px";
  l.style.fontWeight = "900";
  l.style.color = "rgba(255,255,255,.78)";
  l.textContent = String(label || "");

  const v = document.createElement("div");
  v.style.fontSize = "16px";
  v.style.fontWeight = "950";
  v.style.color = "#fff";
  v.textContent = String(value == null ? "" : value);

  c.appendChild(l);
  c.appendChild(v);
  return c;
};
`,
  `
const renderSmartStats = (dash) => {
  const d = dash && typeof dash === "object" ? dash : {};
  const s = d.summary && typeof d.summary === "object" ? d.summary : {};

  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gridTemplateColumns = "repeat(3,minmax(0,1fr))";
  wrap.style.gap = "10px";
  try {
    const w = Number(window.innerWidth || 0) || 0;
    if (w && w < 560) wrap.style.gridTemplateColumns = "repeat(1,minmax(0,1fr))";
  } catch {}

  const totalFiles = Number(s.total || 0) || 0;
  const totalBytes = Number(s.totalBytes || 0) || 0;
  const lastAt = String(s.lastAt || "").trim();

  wrap.appendChild(statCard(isArabic() ? "إجمالي الملفات" : "Total files", String(totalFiles)));
  wrap.appendChild(statCard(isArabic() ? "الحجم الكلي" : "Total size", totalBytes ? fmtBytes(totalBytes) : (isArabic() ? "0 B" : "0 B")));
  wrap.appendChild(statCard(isArabic() ? "آخر رفع" : "Last upload", lastAt ? fmtDateTime(lastAt) : (isArabic() ? "—" : "—")));
  return wrap;
};
`,
  `
const renderDropzone = ({ disabled, onPick, onFiles }) => {
  const z = document.createElement("div");
  z.style.border = "1px dashed rgba(24,181,213,.45)";
  z.style.borderRadius = "16px";
  z.style.background = "rgba(24,181,213,.06)";
  z.style.padding = "16px";
  z.style.display = "flex";
  z.style.flexDirection = "column";
  z.style.gap = "10px";
  z.style.boxShadow = "0 12px 30px rgba(0,0,0,.18)";
  z.style.cursor = disabled ? "not-allowed" : "pointer";
  z.style.opacity = disabled ? "0.65" : "1";

  const t1 = document.createElement("div");
  t1.style.fontSize = "14px";
  t1.style.fontWeight = "950";
  t1.style.color = "#fff";
  t1.textContent = isArabic() ? "ارفع ملفاتك هنا" : "Upload your files here";

  const t2 = document.createElement("div");
  t2.style.fontSize = "12px";
  t2.style.fontWeight = "900";
  t2.style.color = "rgba(255,255,255,.78)";
  t2.textContent = isArabic() ? "اسحب وافلت أو اضغط للاختيار" : "Drag & drop or click to choose";

  const b = document.createElement("button");
  b.type = "button";
  b.textContent = isArabic() ? "اختيار ملفات" : "Choose files";
  b.style.border = "0";
  b.style.cursor = disabled ? "not-allowed" : "pointer";
  b.style.padding = "10px 12px";
  b.style.borderRadius = "12px";
  b.style.background = "#18b5d5";
  b.style.color = "#292929";
  b.style.fontWeight = "950";
  b.style.fontSize = "13px";
  b.style.boxShadow = "0 18px 40px rgba(24,181,213,.25)";
  b.disabled = Boolean(disabled);

  const pick = () => {
    try {
      if (disabled) return;
      if (typeof onPick === "function") onPick();
    } catch {}
  };

  const emit = (files) => {
    try {
      if (disabled) return;
      const fs = files ? Array.from(files) : [];
      if (!fs.length) return;
      if (typeof onFiles === "function") onFiles(fs);
    } catch {}
  };

  z.onclick = () => pick();
  b.onclick = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch {}
    pick();
  };

  const onDrag = (ev) => {
    try {
      if (disabled) return;
      ev.preventDefault();
      ev.stopPropagation();
    } catch {}
  };
  z.addEventListener("dragenter", onDrag);
  z.addEventListener("dragover", onDrag);
  z.addEventListener("dragleave", onDrag);
  z.addEventListener("drop", (ev) => {
    try {
      if (disabled) return;
      ev.preventDefault();
      ev.stopPropagation();
      emit(ev.dataTransfer && ev.dataTransfer.files ? ev.dataTransfer.files : []);
    } catch {}
  });

  z.appendChild(t1);
  z.appendChild(t2);
  z.appendChild(b);
  return z;
};
`,
  `
const renderEmpty = () => {
  const wrap = document.createElement("div");
  wrap.style.border = "1px dashed rgba(24,181,213,.3)";
  wrap.style.borderRadius = "14px";
  wrap.style.padding = "16px";
  wrap.style.background = "rgba(24,181,213,.05)";
  wrap.style.color = "#18b5d5";
  wrap.style.fontSize = "13px";
  wrap.style.fontWeight = "900";
  wrap.textContent = isArabic() ? "مفيش ملفات مرفوعة لحد دلوقتي." : "No media uploaded yet.";
  return wrap;
};
`,
  `
const renderError = (msg) => {
  const wrap = document.createElement("div");
  wrap.style.border = "1px solid rgba(239,68,68,.4)";
  wrap.style.borderRadius = "14px";
  wrap.style.padding = "16px";
  wrap.style.background = "rgba(239,68,68,.1)";
  wrap.style.color = "#ef4444";
  wrap.style.fontSize = "13px";
  wrap.style.fontWeight = "900";
  wrap.textContent = String(msg || "Error");
  return wrap;
};
`,
  `
const renderLoading = () => {
  try {
    const id = "bundle-app-media-loading-style";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent =
        "@keyframes bundleAppMediaIndeterminate{0%{transform:translateX(-120%)}100%{transform:translateX(220%)}}" +
        "@keyframes bundleAppMediaPulse{0%,100%{opacity:.55}50%{opacity:1}}";
      document.head.appendChild(s);
    }
  } catch {}

  const wrap = document.createElement("div");
  wrap.style.border = "1px solid rgba(24,181,213,.3)";
  wrap.style.borderRadius = "14px";
  wrap.style.padding = "14px";
  wrap.style.background = "#292929";

  const title = document.createElement("div");
  title.style.display = "flex";
  title.style.alignItems = "center";
  title.style.justifyContent = "space-between";
  title.style.gap = "10px";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "10px";

  const dot = document.createElement("div");
  dot.style.width = "10px";
  dot.style.height = "10px";
  dot.style.borderRadius = "999px";
  dot.style.background = "#18b5d5";
  dot.style.boxShadow = "0 0 0 6px rgba(24,181,213,.12), 0 14px 30px rgba(24,181,213,.18)";
  dot.style.animation = "bundleAppMediaPulse 1.2s ease-in-out infinite";

  const t = document.createElement("div");
  t.style.color = "#fff";
  t.style.fontSize = "13px";
  t.style.fontWeight = "950";
  t.textContent = isArabic() ? "جاري التحميل" : "Loading";

  left.appendChild(dot);
  left.appendChild(t);

  const hint = document.createElement("div");
  hint.style.color = "rgba(255,255,255,.66)";
  hint.style.fontSize = "12px";
  hint.style.fontWeight = "900";
  hint.textContent = isArabic() ? "لحظة واحدة" : "Please wait";

  title.appendChild(left);
  title.appendChild(hint);

  const bar = document.createElement("div");
  bar.style.marginTop = "12px";
  bar.style.height = "10px";
  bar.style.borderRadius = "999px";
  bar.style.background = "rgba(255,255,255,.08)";
  bar.style.overflow = "hidden";
  bar.style.position = "relative";
  bar.style.border = "1px solid rgba(255,255,255,.10)";

  const fill = document.createElement("div");
  fill.style.position = "absolute";
  fill.style.top = "0";
  fill.style.bottom = "0";
  fill.style.left = "0";
  fill.style.width = "46%";
  fill.style.borderRadius = "999px";
  fill.style.background = "linear-gradient(90deg, rgba(24,181,213,0) 0%, rgba(24,181,213,.92) 40%, rgba(255,255,255,.55) 60%, rgba(24,181,213,.92) 80%, rgba(24,181,213,0) 100%)";
  fill.style.filter = "drop-shadow(0 14px 22px rgba(24,181,213,.25))";
  fill.style.animation = "bundleAppMediaIndeterminate 1.05s ease-in-out infinite";

  bar.appendChild(fill);
  wrap.appendChild(title);
  wrap.appendChild(bar);
  return wrap;
};
`,
  `
const copyText = (text, onDone) => {
  try {
    const t = String(text || "");
    if (!t) return;

    const ok = () => {
      try {
        if (onDone) onDone(true);
      } catch {}
    };
    const bad = () => {
      try {
        if (onDone) onDone(false);
      } catch {}
    };
    const fallback = () => {
      try {
        window.prompt(isArabic() ? "انسخ الرابط" : "Copy link", t);
      } catch {}
      bad();
    };

    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(ok).catch(fallback);
    } else {
      fallback();
    }
  } catch {}
};
`,
  `
const renderLinkBlock = (url) => {
  const u = String(url || "");
  if (!u) return null;

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "stretch";
  wrap.style.gap = "10px";
  wrap.style.padding = "10px";
  wrap.style.borderRadius = "12px";
  wrap.style.border = "1px solid rgba(24,181,213,.35)";
  wrap.style.background = "#292929";
  wrap.style.boxShadow = "0 10px 22px rgba(0,0,0,.14)";

  const a = document.createElement("a");
  a.href = u;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = u;
  a.style.flex = "1 1 auto";
  a.style.minWidth = "0";
  a.style.overflow = "hidden";
  a.style.textOverflow = "ellipsis";
  a.style.whiteSpace = "nowrap";
  a.style.direction = "ltr";
  a.style.fontSize = "14px";
  a.style.fontWeight = "950";
  a.style.color = "#18b5d5";
  a.style.textDecoration = "underline";
  a.style.textDecorationThickness = "2px";
  a.style.textUnderlineOffset = "3px";

  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = isArabic() ? "انسخ الرابط" : "Copy link";
  copy.style.flex = "0 0 auto";
  copy.style.border = "0";
  copy.style.cursor = "pointer";
  copy.style.padding = "10px 14px";
  copy.style.borderRadius = "10px";
  copy.style.background = "#18b5d5";
  copy.style.color = "#292929";
  copy.style.fontSize = "13px";
  copy.style.fontWeight = "950";
  copy.style.boxShadow = "0 12px 26px rgba(24,181,213,.3)";
  copy.onclick = () => {
    try {
      const prev = isArabic() ? "انسخ الرابط" : "Copy link";
      copyText(u, (done) => {
        copy.textContent = done ? (isArabic() ? "تم النسخ" : "Copied") : prev;
        setTimeout(() => {
          copy.textContent = prev;
        }, 1200);
      });
    } catch {}
  };

  wrap.appendChild(a);
  wrap.appendChild(copy);
  return wrap;
};
`,
  `
const renderThumbActions = (url) => {
  const u = String(url || "");
  if (!u) return null;

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "space-between";
  wrap.style.gap = "8px";

  const open = document.createElement("a");
  open.href = u;
  open.target = "_blank";
  open.rel = "noopener";
  open.textContent = isArabic() ? "فتح" : "Open";
  open.style.display = "inline-flex";
  open.style.alignItems = "center";
  open.style.justifyContent = "center";
  open.style.padding = "7px 10px";
  open.style.borderRadius = "10px";
  open.style.border = "1px solid rgba(255,255,255,.14)";
  open.style.background = "rgba(255,255,255,.06)";
  open.style.color = "#fff";
  open.style.fontSize = "12px";
  open.style.fontWeight = "950";
  open.style.textDecoration = "none";
  open.style.flex = "1 1 auto";

  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = isArabic() ? "نسخ" : "Copy";
  copy.style.flex = "0 0 auto";
  copy.style.border = "0";
  copy.style.cursor = "pointer";
  copy.style.padding = "7px 10px";
  copy.style.borderRadius = "10px";
  copy.style.background = "#18b5d5";
  copy.style.color = "#292929";
  copy.style.fontSize = "12px";
  copy.style.fontWeight = "950";
  copy.style.boxShadow = "0 10px 22px rgba(24,181,213,.22)";
  copy.onclick = () => {
    try {
      const prev = isArabic() ? "نسخ" : "Copy";
      copyText(u, (done) => {
        copy.textContent = done ? (isArabic() ? "تم" : "Copied") : prev;
        setTimeout(() => {
          copy.textContent = prev;
        }, 900);
      });
    } catch {}
  };

  wrap.appendChild(open);
  wrap.appendChild(copy);
  return wrap;
};
`,
  `
const renderUploadRow = (rec) => {
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "10px";
  wrap.style.padding = "12px";
  wrap.style.borderRadius = "14px";
  wrap.style.border = "1px solid rgba(24,181,213,.25)";
  wrap.style.background = "#292929";
  wrap.style.boxShadow = "0 10px 22px rgba(0,0,0,.14)";

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.justifyContent = "space-between";
  row.style.gap = "10px";

  const left = document.createElement("div");
  left.style.minWidth = "0";
  left.style.display = "flex";
  left.style.flexDirection = "column";
  left.style.gap = "4px";

  const name = document.createElement("div");
  name.style.fontSize = "12px";
  name.style.fontWeight = "950";
  name.style.color = "#fff";
  name.style.overflow = "hidden";
  name.style.textOverflow = "ellipsis";
  name.style.whiteSpace = "nowrap";
  name.textContent = String(rec.name || "");

  const sub = document.createElement("div");
  sub.style.fontSize = "12px";
  sub.style.fontWeight = "900";
  sub.style.color = rec.status === "error" ? "#ef4444" : "rgba(24,181,213,.9)";
  const pct = (() => {
    try {
      const p = Number(rec && rec.progress);
      if (!Number.isFinite(p)) return 0;
      return Math.max(0, Math.min(100, Math.round(p)));
    } catch {
      return 0;
    }
  })();
  sub.textContent =
    rec.status === "uploading"
      ? (isArabic() ? "جاري الرفع " : "Uploading ") + String(pct) + "%"
      : rec.status === "done"
        ? isArabic()
          ? "تم الرفع"
          : "Uploaded"
        : rec.status === "error"
          ? String(rec.error || "Error")
          : isArabic()
            ? "في الانتظار"
            : "Queued";

  left.appendChild(name);
  left.appendChild(sub);

  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "10px";
  right.style.flex = "0 0 auto";

  const meta = document.createElement("div");
  meta.style.fontSize = "12px";
  meta.style.fontWeight = "900";
  meta.style.color = "rgba(24,181,213,.8)";
  meta.style.textAlign = "right";
  meta.textContent = rec.status === "uploading" ? String(pct) + "%" : (rec.size ? fmtBytes(rec.size) : "");
  right.appendChild(meta);

  row.appendChild(left);
  row.appendChild(right);
  wrap.appendChild(row);

  if (rec.status === "uploading") {
    const bar = document.createElement("div");
    bar.style.height = "10px";
    bar.style.borderRadius = "999px";
    bar.style.background = "rgba(255,255,255,.08)";
    bar.style.border = "1px solid rgba(255,255,255,.10)";
    bar.style.overflow = "hidden";
    bar.style.position = "relative";

    const fill = document.createElement("div");
    fill.style.height = "100%";
    fill.style.width = String(pct) + "%";
    fill.style.borderRadius = "999px";
    fill.style.background = "linear-gradient(90deg, rgba(24,181,213,.35) 0%, rgba(24,181,213,.95) 50%, rgba(255,255,255,.55) 100%)";
    fill.style.boxShadow = "0 12px 22px rgba(24,181,213,.18)";
    fill.style.transition = "width .12s ease";

    bar.appendChild(fill);
    wrap.appendChild(bar);
  }

  const url = String((rec && rec.url) || "");
  if (url && rec.status === "done") {
    const block = renderLinkBlock(url);
    if (block) wrap.appendChild(block);
  }

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
const renderGrid = (items) => {
  const grid = document.createElement("div");
  grid.style.display = "grid";
  const cols = (() => {
    try {
      const w = Number(window.innerWidth || 0) || 0;
      if (w && w < 460) return 2;
      if (w && w < 760) return 3;
      return 4;
    } catch {
      return 4;
    }
  })();
  grid.style.gridTemplateColumns = "repeat(" + String(cols) + ",minmax(0,1fr))";
  grid.style.gap = "10px";
  grid.style.alignItems = "stretch";
  grid.style.marginTop = "4px";

  for (let i = 0; i < items.length; i += 1) {
    const it = items[i] || {};
    const src = String(it.deliveryUrl || it.secureUrl || it.url || "");

    const card = document.createElement("div");
    card.style.border = "1px solid rgba(24,181,213,.20)";
    card.style.borderRadius = "14px";
    card.style.overflow = "hidden";
    card.style.background = "#292929";
    card.style.boxShadow = "0 10px 22px rgba(0,0,0,.14)";

    const media = document.createElement("div");
    media.style.width = "100%";
    media.style.aspectRatio = "16 / 10";
    media.style.background = "rgba(24,181,213,.08)";
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
      v.style.objectFit = "cover";
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
      img.style.objectFit = "cover";
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

      const actions = renderThumbActions(src);
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
    b.style.background = active ? "rgba(24,181,213,.18)" : "#292929";
    b.style.color = active ? "#18b5d5" : "#fff";
    b.style.padding = "8px 10px";
    b.style.borderRadius = "12px";
    b.style.fontSize = "12px";
    b.style.fontWeight = "950";
    b.style.cursor = disabled ? "not-allowed" : "pointer";
    b.style.opacity = disabled ? "0.6" : "1";
    b.style.boxShadow = active ? "0 14px 30px rgba(24,181,213,.18)" : "0 10px 24px rgba(0,0,0,.2)";
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
