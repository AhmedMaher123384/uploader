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
  btn.style.background = "#373737";
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
  panel.style.background = "#303030";
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
  close.style.background = "#373737";
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
  b.style.background = active ? "#18b5d5" : "#373737";
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
  b.style.background = "#373737";
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
  b.textContent = isArabic() ? "اختيار ملف" : "Choose files";
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
  wrap.style.background = "#373737";

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
  wrap.style.background = "#373737";
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
`
];
