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
const uiViewportMin = () => {
  try {
    const w = Number(window.innerWidth || 0) || 0;
    const h = Number(window.innerHeight || 0) || 0;
    const m = Math.min(w || 0, h || 0);
    return m || w || h || 0;
  } catch {
    return 0;
  }
};

const uiIsMobile = () => {
  try {
    if (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) return true;
  } catch {}
  const m = uiViewportMin();
  return Boolean(m && m <= 640);
};

const uiIsTinyMobile = () => {
  const m = uiViewportMin();
  return Boolean(m && m <= 380);
};

const uiPick = (desktop, mobile, tiny) => {
  if (uiIsTinyMobile()) return tiny == null ? mobile : tiny;
  if (uiIsMobile()) return mobile;
  return desktop;
};
`,
  `
const setFabVisible = (btn, on) => {
  try {
    btn.style.opacity = on ? "1" : "0";
    btn.style.pointerEvents = on ? "auto" : "none";
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
  btn.setAttribute("aria-label", isArabic() ? "ملاك ابلودر" : "Malak Uploader");
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
  btn.style.display = "grid";
  btn.style.placeItems = "center";
  btn.style.userSelect = "none";
  btn.style.webkitUserSelect = "none";
  btn.style.lineHeight = "1";
  btn.style.fontWeight = "900";
  btn.style.opacity = "1";
  btn.style.pointerEvents = "auto";

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
const buildLegalTheme = () => {
  return {
    overlayBg: "rgba(0,0,0,.55)",
    panelBg: "#303030",
    cardBg: "#373737",
    border: "1px solid rgba(255,255,255,.10)",
    borderSoft: "1px solid rgba(255,255,255,.08)",
    borderBrand: "1px solid rgba(24,181,213,.22)",
    text: "rgba(255,255,255,.92)",
    textMuted: "rgba(255,255,255,.70)",
    textFaint: "rgba(255,255,255,.55)",
    brand: "#18b5d5"
  };
};

const getLegalCopy = (kind, ar) => {
  const k = String(kind || "").trim().toLowerCase() || "terms";
  const isPrivacy = k === "privacy";
  const updated = ar ? "آخر تحديث: 2026-01-13" : "Last updated: 2026-01-13";

  const intro = isPrivacy
    ? (ar
        ? "توضح سياسة الخصوصية كيفية تعاملنا مع بياناتك عند استخدام رفع الملفات."
        : "Privacy Policy explains how we handle your data while using Upload Center.")
    : (ar
        ? "توضح شروط الاستخدام القواعد والمسؤوليات الأساسية لاستخدام رفع الملفات."
        : "Terms of Use describe the basic rules and responsibilities when using Upload Center.");

  const mk = (id, title, points) => ({ id: String(id || ""), title: String(title || ""), points: Array.isArray(points) ? points : [] });

  if (isPrivacy) {
    return {
      title: ar ? "سياسة الخصوصية" : "Privacy Policy",
      updated,
      intro,
      sections: ar
        ? [
            mk("collect", "المعلومات التي نجمعها", ["معلومات فنية عن الملف (مثل النوع والحجم).", "معرّفات تشغيل داخلية مرتبطة بمتجرك.", "قد يتم تسجيل أحداث تقنية لأغراض الأمان والتشخيص."]),
            mk("use", "كيفية استخدام المعلومات", ["رفع الملفات وإدارتها.", "تحسين الأداء وتجربة الاستخدام.", "منع إساءة الاستخدام وحماية الخدمة."]),
            mk("share", "المشاركة مع أطراف خارجية", ["قد نعتمد على مزوّدي بنية تحتية (تخزين/شبكات) لتنفيذ الخدمة.", "لا نقوم ببيع بياناتك."]),
            mk("retain", "الاحتفاظ والحذف", ["نحتفظ بالبيانات للمدة اللازمة لتقديم الخدمة أو للمتطلبات القانونية/الأمنية.", "يمكنك حذف ملفاتك من تبويب (ملفاتك) عند توفره."]),
            mk("rights", "حقوقك", ["يمكنك طلب حذف/مراجعة بيانات مرتبطة باستخدامك للخدمة عبر فريق الدعم."])
          ]
        : [
            mk("collect", "Information We Collect", ["Technical file metadata (type/size).", "Internal operational identifiers tied to your store.", "Technical event logs for security and diagnostics."]),
            mk("use", "How We Use It", ["Upload and manage files.", "Improve performance and user experience.", "Prevent abuse and protect the service."]),
            mk("share", "Sharing", ["We may rely on infrastructure providers (storage/network) to deliver the service.", "We do not sell your data."]),
            mk("retain", "Retention & Deletion", ["We retain data as needed to provide the service or for legal/security needs.", "You can delete your files from the 'My files' tab when available."]),
            mk("rights", "Your Rights", ["You can request deletion/review of data related to your usage through support."])
          ]
    };
  }

  return {
    title: ar ? "شروط الاستخدام" : "Terms of Use",
    updated,
    intro,
    sections: ar
      ? [
          mk("allowed", "الاستخدام المسموح", ["لا يجوز رفع إلا المحتوى الذي تملكه أو تملك حق استخدامه.", "يجب استخدام الخدمة لأغراض مشروعة وبما يتوافق مع سياسات منصتك."]),
          mk("blocked", "المحتوى المحظور", ["لا يجوز رفع محتوى ينتهك حقوق الملكية الفكرية.", "لا يجوز رفع محتوى غير قانوني أو ضار أو يتضمن برمجيات خبيثة."]),
          mk("resp", "المسؤولية", ["تتحمل المسؤولية عن الملفات التي تقوم برفعها وكيفية استخدامها.", "قد تتأثر إتاحة الخدمة مؤقتًا بسبب الصيانة أو الأسباب التقنية."]),
          mk("retain", "الحذف والاحتفاظ", ["يمكنك حذف ملفاتك من تبويب (ملفاتك) عند توفره.", "قد نحتفظ بنسخ تشغيلية/أمنية مؤقتة ضمن حدود معقولة."])
        ]
      : [
          mk("allowed", "Permitted Use", ["Upload only content you own or have rights to use.", "Use the service lawfully and in compliance with your platform policies."]),
          mk("blocked", "Prohibited Content", ["Do not upload content that infringes IP rights.", "Do not upload illegal, harmful content, or malware."]),
          mk("resp", "Responsibility", ["You are responsible for the files you upload and how you use them.", "Service availability may be impacted by maintenance or technical issues."]),
          mk("retain", "Retention & Deletion", ["You can delete your files from the 'My files' tab when available.", "We may keep temporary operational/security copies within reasonable limits."])
        ]
  };
};

const buildLegalOverlay = (theme) => {
  const overlay = document.createElement("div");
  overlay.className = "bundle-app-bottomsheet";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "14px";
  overlay.style.background = theme.overlayBg;
  overlay.style.zIndex = "100004";
  return overlay;
};

const buildLegalPanel = (theme) => {
  const panel = document.createElement("div");
  panel.className = "bundle-app-bottomsheet__panel";
  panel.style.width = "min(760px,100%)";
  panel.style.maxHeight = "85vh";
  panel.style.overflow = "auto";
  panel.style.background = theme.panelBg;
  panel.style.borderRadius = "16px";
  panel.style.border = theme.borderBrand;
  return panel;
};

const buildLegalHead = (titleText, theme, onClose) => {
  const head = document.createElement("div");
  head.className = "bundle-app-bottomsheet__head";
  head.style.padding = "16px 14px";
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.justifyContent = "space-between";
  head.style.gap = "10px";
  head.style.borderBottom = "1px solid rgba(24,181,213,.2)";

  const title = document.createElement("div");
  title.className = "bundle-app-bottomsheet__title";
  title.textContent = String(titleText || "");
  title.style.fontSize = "20px";
  title.style.fontWeight = "950";
  title.style.color = "#fff";
  title.style.minWidth = "0";
  title.style.overflow = "hidden";
  title.style.textOverflow = "ellipsis";
  title.style.whiteSpace = "nowrap";

  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", isArabic() ? "إغلاق" : "Close");
  close.setAttribute("title", isArabic() ? "إغلاق" : "Close");
  close.textContent = "";
  close.style.border = "0";
  close.style.background = "transparent";
  close.style.padding = "0";
  close.style.width = "36px";
  close.style.height = "36px";
  close.style.display = "grid";
  close.style.placeItems = "center";
  close.style.color = theme.brand;
  close.style.cursor = "pointer";
  const closeIcon = document.createElement("i");
  closeIcon.className = "sicon-cancel";
  closeIcon.setAttribute("aria-hidden", "true");
  closeIcon.style.display = "block";
  closeIcon.style.fontSize = "18px";
  closeIcon.style.lineHeight = "1";
  closeIcon.style.pointerEvents = "none";
  close.appendChild(closeIcon);
  close.onclick = () => {
    try {
      if (typeof onClose === "function") onClose();
    } catch {}
  };

  head.appendChild(title);
  head.appendChild(close);
  return head;
};

const buildLegalInfoBar = (copy, theme) => {
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexWrap = "wrap";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "space-between";
  wrap.style.gap = "10px";
  wrap.style.border = theme.borderSoft;
  wrap.style.background = theme.cardBg;
  wrap.style.borderRadius = "14px";
  wrap.style.padding = "12px";

  const left = document.createElement("div");
  left.style.minWidth = "0";

  const intro = document.createElement("div");
  intro.style.fontSize = "12px";
  intro.style.fontWeight = "900";
  intro.style.color = theme.textMuted;
  intro.style.lineHeight = "1.75";
  intro.textContent = String((copy && copy.intro) || "");

  const updated = document.createElement("div");
  updated.style.marginTop = "6px";
  updated.style.fontSize = "11px";
  updated.style.fontWeight = "900";
  updated.style.color = theme.textFaint;
  updated.textContent = String((copy && copy.updated) || "");

  left.appendChild(intro);
  left.appendChild(updated);

  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "8px";
  right.style.flex = "0 0 auto";

  const badge = document.createElement("div");
  badge.textContent = isArabic() ? "نص إرشادي" : "Guideline";
  badge.style.padding = "6px 10px";
  badge.style.borderRadius = "999px";
  badge.style.border = "1px solid rgba(24,181,213,.35)";
  badge.style.background = "rgba(24,181,213,.10)";
  badge.style.color = theme.brand;
  badge.style.fontWeight = "950";
  badge.style.fontSize = "11px";

  right.appendChild(badge);

  wrap.appendChild(left);
  wrap.appendChild(right);
  return wrap;
};

const buildLegalToc = (sections, theme, onJump) => {
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexWrap = "wrap";
  wrap.style.gap = "8px";
  wrap.style.alignItems = "center";

  const mk = (label, id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(label || "");
    b.style.border = theme.borderSoft;
    b.style.background = theme.cardBg;
    b.style.color = theme.text;
    b.style.padding = "8px 10px";
    b.style.borderRadius = "12px";
    b.style.fontSize = "12px";
    b.style.fontWeight = "950";
    b.style.cursor = "pointer";
    b.onclick = () => {
      try {
        if (typeof onJump === "function") onJump(String(id || ""));
      } catch {}
    };
    return b;
  };

  for (let i = 0; i < (sections || []).length; i += 1) {
    const s = sections[i] || {};
    wrap.appendChild(mk(String(s.title || ""), String(s.id || "")));
  }
  return wrap;
};

const buildLegalSectionCard = (sec, idx, theme) => {
  const box = document.createElement("div");
  box.id = "legal_" + String((sec && sec.id) || "");
  box.style.border = theme.borderSoft;
  box.style.background = theme.cardBg;
  box.style.borderRadius = "14px";
  box.style.padding = "12px";

  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "flex-start";
  head.style.justifyContent = "space-between";
  head.style.gap = "10px";

  const title = document.createElement("div");
  title.style.fontSize = "13px";
  title.style.fontWeight = "950";
  title.style.color = theme.text;
  title.style.lineHeight = "1.4";
  title.textContent = String((sec && sec.title) || "");

  const num = document.createElement("div");
  num.textContent = String(idx + 1);
  num.style.flex = "0 0 auto";
  num.style.minWidth = "28px";
  num.style.height = "28px";
  num.style.display = "grid";
  num.style.placeItems = "center";
  num.style.borderRadius = "10px";
  num.style.border = "1px solid rgba(24,181,213,.28)";
  num.style.background = "rgba(24,181,213,.10)";
  num.style.color = theme.brand;
  num.style.fontWeight = "950";
  num.style.fontSize = "12px";

  head.appendChild(title);
  head.appendChild(num);

  const list = document.createElement("div");
  list.style.marginTop = "10px";
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "8px";

  for (let i = 0; i < (sec && sec.points ? sec.points : []).length; i += 1) {
    const line = document.createElement("div");
    line.style.display = "flex";
    line.style.alignItems = "flex-start";
    line.style.gap = "8px";

    const dot = document.createElement("div");
    dot.textContent = "•";
    dot.style.color = theme.brand;
    dot.style.fontWeight = "950";
    dot.style.lineHeight = "1.6";
    dot.style.marginTop = "1px";

    const txt = document.createElement("div");
    txt.style.fontSize = "12px";
    txt.style.fontWeight = "850";
    txt.style.color = theme.textMuted;
    txt.style.lineHeight = "1.75";
    txt.textContent = String(sec.points[i] || "");

    line.appendChild(dot);
    line.appendChild(txt);
    list.appendChild(line);
  }

  box.appendChild(head);
  box.appendChild(list);
  return box;
};

const openLegalSheet = (kind) => {
  try {
    const ar = isArabic();
    const copy = getLegalCopy(kind, ar);
    const theme = buildLegalTheme();

    const overlay = buildLegalOverlay(theme);
    const panel = buildLegalPanel(theme);

    const done = () => {
      try {
        overlay.remove();
      } catch {}
    };

    const head = buildLegalHead(copy.title, theme, done);

    const body = document.createElement("div");
    body.style.padding = "14px";
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "10px";
    try {
      const rtl = typeof isRtl === "function" && isRtl();
      body.style.direction = rtl ? "rtl" : "ltr";
    } catch {}

    const info = buildLegalInfoBar(copy, theme);

    const jump = (id) => {
      try {
        const el = document.getElementById("legal_" + String(id || ""));
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "auto", block: "start" });
      } catch {}
    };

    const toc = buildLegalToc(copy.sections, theme, jump);

    const tocWrap = document.createElement("div");
    tocWrap.style.border = theme.borderSoft;
    tocWrap.style.background = theme.cardBg;
    tocWrap.style.borderRadius = "14px";
    tocWrap.style.padding = "12px";

    const tocTitle = document.createElement("div");
    tocTitle.style.fontSize = "12px";
    tocTitle.style.fontWeight = "950";
    tocTitle.style.color = theme.text;
    tocTitle.textContent = ar ? "المحتويات" : "Contents";

    tocWrap.appendChild(tocTitle);
    tocWrap.appendChild(toc);

    body.appendChild(info);
    body.appendChild(tocWrap);

    for (let i = 0; i < copy.sections.length; i += 1) {
      body.appendChild(buildLegalSectionCard(copy.sections[i], i, theme));
    }

    panel.appendChild(head);
    panel.appendChild(body);
    overlay.appendChild(panel);

    overlay.addEventListener("click", (ev) => {
      try {
        if (ev.target === overlay) done();
      } catch {}
    });
    panel.addEventListener("click", (ev) => {
      try {
        ev.stopPropagation();
      } catch {}
    });

    document.body.appendChild(overlay);
  } catch {}
};

const buildLegalFooter = () => {
  const wrap = document.createElement("div");
  wrap.style.marginTop = "12px";
  wrap.style.paddingTop = "10px";
  wrap.style.borderTop = "1px solid rgba(255,255,255,.08)";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.flexWrap = "wrap";
  wrap.style.rowGap = "8px";
  wrap.style.columnGap = "10px";
  wrap.style.userSelect = "none";
  wrap.style.webkitUserSelect = "none";

  const mkLink = (label, kind) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(label || "");
    b.style.border = "0";
    b.style.background = "transparent";
    b.style.padding = "0 2px";
    b.style.margin = "0";
    b.style.cursor = "pointer";
    b.style.fontSize = "12px";
    b.style.fontWeight = "950";
    b.style.color = "#fff";
    b.style.textDecoration = "none";
    b.style.whiteSpace = "nowrap";
    b.onclick = () => openLegalSheet(kind);
    return b;
  };

  const sep = document.createElement("span");
  sep.textContent = "|";
  sep.style.color = "rgba(255,255,255,.55)";
  sep.style.fontWeight = "900";
  sep.style.margin = "0 10px";

  wrap.appendChild(mkLink(isArabic() ? "شروط الاستخدام" : "Terms of Use", "terms"));
  wrap.appendChild(sep);
  wrap.appendChild(mkLink(isArabic() ? "سياسة الخصوصية" : "Privacy Policy", "privacy"));
  return wrap;
};

const buildSheet = () => {
  const isMobile = typeof uiIsMobile === "function" && uiIsMobile();
  const isTiny = typeof uiIsTinyMobile === "function" && uiIsTinyMobile();

  const overlay = document.createElement("div");
  overlay.className = "bundle-app-bottomsheet";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = isMobile ? (isTiny ? "6px" : "8px") : "14px";
  overlay.style.zIndex = "100003";

  const panel = document.createElement("div");
  panel.className = "bundle-app-bottomsheet__panel";
  panel.style.width = isMobile ? "100%" : "min(760px,100%)";
  panel.style.height = isMobile ? (isTiny ? "94vh" : "92vh") : "85vh";
  panel.style.overflow = "hidden";
  panel.style.background = "#303030";
  panel.style.borderRadius = isMobile ? (isTiny ? "14px" : "15px") : "16px";
  panel.style.border = "1px solid rgba(24,181,213,.18)";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";

  const head = document.createElement("div");
  head.className = "bundle-app-bottomsheet__head";
  head.style.padding = isMobile ? (isTiny ? "10px 10px" : "12px 12px") : "14px 14px";
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.justifyContent = "space-between";
  head.style.gap = "10px";
  head.style.borderBottom = "1px solid rgba(24,181,213,.2)";
  head.style.background = "linear-gradient(90deg, rgba(24,181,213,.14), rgba(48,48,48,0))";

  const title = document.createElement("div");
  title.className = "bundle-app-bottomsheet__title";
  title.textContent = isArabic() ? "ملاك ابلودر" : "Malak Uploader";
  title.style.fontSize = isMobile ? (isTiny ? "15px" : "16px") : "19px";
  title.style.fontWeight = "900";
  title.style.color = "#18b5d5";
  title.style.letterSpacing = ".2px";

  const headActions = document.createElement("div");
  headActions.style.display = "flex";
  headActions.style.alignItems = "center";
  headActions.style.gap = "8px";
  headActions.style.flex = "0 0 auto";

  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", isArabic() ? "إغلاق" : "Close");
  close.setAttribute("title", isArabic() ? "إغلاق" : "Close");
  close.textContent = "";
  close.style.border = "0";
  close.style.background = "transparent";
  close.style.padding = "0";
  close.style.width = isMobile ? "32px" : "36px";
  close.style.height = isMobile ? "32px" : "36px";
  close.style.display = "grid";
  close.style.placeItems = "center";
  close.style.color = "#fff";
  close.style.cursor = "pointer";
  const closeIcon = document.createElement("i");
  closeIcon.className = "sicon-cancel";
  closeIcon.setAttribute("aria-hidden", "true");
  closeIcon.style.display = "block";
  closeIcon.style.fontSize = isMobile ? "16px" : "18px";
  closeIcon.style.lineHeight = "1";
  closeIcon.style.pointerEvents = "none";
  close.appendChild(closeIcon);

  const headRight = document.createElement("div");
  headRight.style.display = "flex";
  headRight.style.alignItems = "center";
  headRight.style.gap = "8px";
  headRight.style.flex = "0 0 auto";

  headRight.appendChild(headActions);
  headRight.appendChild(close);

  head.appendChild(title);
  head.appendChild(headRight);

  const body = document.createElement("div");
  body.style.padding = isMobile ? "0 10px 10px" : "0 14px 14px";
  body.style.display = "flex";
  body.style.flexDirection = "column";
  body.style.flex = "1 1 auto";
  body.style.minHeight = "0";
  body.style.overflow = "hidden";

  const topRow = document.createElement("div");
  topRow.style.display = "flex";
  topRow.style.alignItems = "center";
  topRow.style.justifyContent = "space-between";
  topRow.style.gap = isMobile ? "8px" : "10px";
  topRow.style.flexWrap = "wrap";
  topRow.style.padding = isMobile ? "8px 0" : "12px 0";

  const tabs = document.createElement("div");
  tabs.style.display = isMobile ? "flex" : "grid";
  if (isMobile) {
    tabs.style.alignItems = "stretch";
    tabs.style.justifyContent = "space-between";
    tabs.style.gap = "6px";
    tabs.style.flexWrap = "nowrap";
    tabs.style.overflowX = "auto";
    tabs.style.overflowY = "hidden";
    tabs.style.webkitOverflowScrolling = "touch";
    tabs.style.scrollbarWidth = "none";
    tabs.style.msOverflowStyle = "none";
  } else {
    tabs.style.gridTemplateColumns = "repeat(auto-fit,minmax(140px,1fr))";
    tabs.style.gap = "10px";
  }
  tabs.style.width = "100%";

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";
  actions.style.flexWrap = "wrap";

  topRow.appendChild(tabs);
  topRow.appendChild(actions);

  const uploads = document.createElement("div");
  uploads.style.display = "none";
  uploads.style.flexDirection = "column";
  uploads.style.gap = isMobile ? "6px" : "8px";
  uploads.style.marginBottom = "10px";
  uploads.style.maxHeight = "min(360px, 42vh)";
  uploads.style.overflow = "auto";
  uploads.style.padding = "2px";

  const content = document.createElement("div");
  content.style.display = "flex";
  content.style.flexDirection = "column";
  content.style.gap = isMobile ? "10px" : "12px";
  content.style.flex = "1 1 auto";
  content.style.minHeight = "0";
  content.style.overflow = "auto";

  const footer = document.createElement("div");
  footer.style.flex = "0 0 auto";

  body.appendChild(topRow);
  body.appendChild(content);
  body.appendChild(uploads);
  body.appendChild(footer);
  panel.appendChild(head);
  panel.appendChild(body);
  overlay.appendChild(panel);

  return { overlay, closeBtn: close, title, tabs, actions, uploads, content, footer, headActions };
};
`,
  `
const pill = (label, active) => {
  const isMobile = typeof uiIsMobile === "function" && uiIsMobile();
  const isTiny = typeof uiIsTinyMobile === "function" && uiIsTinyMobile();
  const b = document.createElement("button");
  b.type = "button";
  b.className = "bundleapp-tab";
  b.textContent = label;
  b.style.display = "flex";
  b.style.alignItems = "center";
  b.style.justifyContent = "center";
  b.style.border = active ? "1px solid rgba(24,181,213,.5)" : "1px solid rgba(255,255,255,.1)";
  b.style.background = active ? "#18b5d5" : "#373737";
  b.style.color = active ? "#303030" : "#fff";
  b.style.padding = isMobile ? (isTiny ? "7px 8px" : "8px 10px") : "10px 14px";
  b.style.borderRadius = isMobile ? "9px" : "10px";
  b.style.fontSize = isMobile ? (isTiny ? "11px" : "12px") : "14px";
  b.style.fontWeight = "900";
  b.style.cursor = "pointer";
  b.style.width = isMobile ? "auto" : "100%";
  b.style.flex = isMobile ? "1 1 0" : "0 0 auto";
  b.style.minWidth = isMobile ? "0" : "";
  b.style.whiteSpace = "nowrap";
  b.style.overflow = "hidden";
  b.style.textOverflow = "ellipsis";
  return b;
};
`,
  `
const btnPrimary = (label) => {
  const isMobile = typeof uiIsMobile === "function" && uiIsMobile();
  const isTiny = typeof uiIsTinyMobile === "function" && uiIsTinyMobile();
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.border = "0";
  b.style.cursor = "pointer";
  b.style.padding = isMobile ? (isTiny ? "8px 10px" : "9px 10px") : "10px 12px";
  b.style.borderRadius = isMobile ? "11px" : "12px";
  b.style.background = "#18b5d5";
  b.style.color = "#303030";
  b.style.fontWeight = "900";
  b.style.fontSize = isMobile ? "12px" : "13px";
  return b;
};
`,
  `
const btnGhost = (label) => {
  const isMobile = typeof uiIsMobile === "function" && uiIsMobile();
  const isTiny = typeof uiIsTinyMobile === "function" && uiIsTinyMobile();
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.border = "1px solid rgba(24,181,213,.3)";
  b.style.cursor = "pointer";
  b.style.padding = isMobile ? (isTiny ? "8px 10px" : "9px 10px") : "10px 12px";
  b.style.borderRadius = isMobile ? "11px" : "12px";
  b.style.background = "#373737";
  b.style.color = "#18b5d5";
  b.style.fontWeight = "900";
  b.style.fontSize = isMobile ? "12px" : "13px";
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
const renderDropzone = (opts) => {
  const o = opts && typeof opts === "object" ? opts : {};
  const disabled = Boolean(o.disabled);
  const hint = o.hint;
  const hintPopover = o.hintPopover && typeof o.hintPopover === "object" ? o.hintPopover : null;
  const onPick = o.onPick;
  const onFiles = o.onFiles;

  const z = document.createElement("div");
  z.style.border = "1px dashed rgba(255,255,255,.12)";
  z.style.borderRadius = "12px";
  z.style.background = "#373737";
  z.style.padding = "32px 20px";
  z.style.display = "flex";
  z.style.flexDirection = "column";
  z.style.alignItems = "center";
  z.style.justifyContent = "center";
  z.style.gap = "10px";
  z.style.cursor = disabled ? "not-allowed" : "pointer";
  z.style.opacity = disabled ? "0.5" : "1";

  const icon = document.createElement("div");
  icon.style.color = "rgba(255,255,255,.40)";
  icon.style.fontSize = "32px";
  icon.style.lineHeight = "1";
  icon.textContent = "📁";

  const t1 = document.createElement("div");
  t1.style.color = "rgba(255,255,255,.70)";
  t1.style.fontSize = "13px";
  t1.style.fontWeight = "900";
  t1.style.textAlign = "center";
  t1.textContent = isArabic() ? "اسحب الملفات هنا أو اضغط للاختيار" : "Drag files here or click to select";

  const t2 = document.createElement("div");
  t2.style.display = "flex";
  t2.style.alignItems = "center";
  t2.style.justifyContent = "center";
  t2.style.flexWrap = "wrap";
  t2.style.gap = "6px";
  t2.style.maxWidth = "100%";
  t2.style.direction = isArabic() ? "rtl" : "ltr";

  const hintText = document.createElement("div");
  hintText.style.color = "rgba(255,255,255,.45)";
  hintText.style.fontSize = "11px";
  hintText.style.fontWeight = "900";
  hintText.style.textAlign = "center";
  hintText.style.lineHeight = "1.6";
  hintText.textContent = String(hint || "").trim() || (isArabic() ? "الصيغ المدعومة حسب نوع الملف" : "Supported formats vary by file type");
  t2.appendChild(hintText);

  let pop = null;
  let closeTimer = null;
  const clearCloseTimer = () => {
    try {
      if (closeTimer) clearTimeout(closeTimer);
    } catch {}
    closeTimer = null;
  };
  const closePopover = () => {
    try {
      clearCloseTimer();
      if (!pop) return;
      try {
        document.removeEventListener("mousedown", onDocDown, true);
      } catch {}
      try {
        document.removeEventListener("keydown", onKeyDown, true);
      } catch {}
      try {
        window.removeEventListener("scroll", closePopover, true);
      } catch {}
      try {
        window.removeEventListener("resize", positionPopover, true);
      } catch {}
      try {
        pop.remove();
      } catch {}
      pop = null;
    } catch {}
  };
  const positionPopover = () => {
    try {
      if (!pop || !infoBtn) return;
      const r = infoBtn.getBoundingClientRect();
      const vw = Math.max(0, Number(window && window.innerWidth) || 0);
      const vh = Math.max(0, Number(window && window.innerHeight) || 0);
      const pad = 10;
      const maxW = Math.max(220, Math.min(360, vw - pad * 2));
      pop.style.maxWidth = String(maxW) + "px";
      pop.style.width = "max-content";
      const pw = Math.min(maxW, Math.max(220, Number(pop.offsetWidth || 0) || 0));
      const ph = Math.max(0, Number(pop.offsetHeight || 0) || 0);

      const preferRight = isArabic();
      let left = preferRight ? (r.right - pw) : r.left;
      left = Math.max(pad, Math.min(left, vw - pw - pad));

      const belowTop = r.bottom + 8;
      const aboveTop = r.top - ph - 8;
      let top = belowTop;
      if (belowTop + ph + pad > vh && aboveTop >= pad) top = aboveTop;
      top = Math.max(pad, Math.min(top, vh - ph - pad));

      pop.style.left = String(Math.round(left)) + "px";
      pop.style.top = String(Math.round(top)) + "px";
    } catch {}
  };
  const buildPopover = () => {
    const p = document.createElement("div");
    p.style.position = "fixed";
    p.style.zIndex = "100010";
    p.style.padding = "12px";
    p.style.borderRadius = "14px";
    p.style.border = "1px solid rgba(255,255,255,.10)";
    p.style.background = "#1f1f1f";
    p.style.boxShadow = "0 24px 60px rgba(0,0,0,.45)";
    p.style.color = "rgba(255,255,255,.92)";
    p.style.fontWeight = "900";
    p.style.fontSize = "12px";
    p.style.lineHeight = "1.6";
    p.style.opacity = "0";
    p.style.transform = "translateY(-2px)";
    p.style.transition = "opacity .12s ease, transform .12s ease";
    p.style.pointerEvents = "auto";
    p.style.direction = isArabic() ? "rtl" : "ltr";

    const title = document.createElement("div");
    title.style.fontSize = "12px";
    title.style.fontWeight = "950";
    title.style.color = "rgba(255,255,255,.96)";
    title.style.marginBottom = "8px";
    title.textContent = String((hintPopover && hintPopover.title) || "").trim() || (isArabic() ? "الصيغ المتاحة" : "Allowed formats");
    p.appendChild(title);

    const sections = Array.isArray(hintPopover && hintPopover.sections) ? hintPopover.sections : [];
    for (let i = 0; i < sections.length; i += 1) {
      const sec = sections[i] && typeof sections[i] === "object" ? sections[i] : {};
      const label = String(sec.label || "").trim();
      const items = Array.isArray(sec.items) ? sec.items : [];
      if (!label && !items.length) continue;

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.flexDirection = "column";
      row.style.gap = "6px";
      row.style.paddingTop = i === 0 ? "0" : "8px";
      row.style.marginTop = i === 0 ? "0" : "8px";
      if (i !== 0) row.style.borderTop = "1px solid rgba(255,255,255,.08)";

      if (label) {
        const h = document.createElement("div");
        h.style.color = "rgba(255,255,255,.75)";
        h.style.fontSize = "11px";
        h.style.fontWeight = "950";
        h.textContent = label;
        row.appendChild(h);
      }

      if (items.length) {
        const chips = document.createElement("div");
        chips.style.display = "flex";
        chips.style.flexWrap = "wrap";
        chips.style.gap = "6px";
        for (let j = 0; j < items.length; j += 1) {
          const it = String(items[j] || "").trim();
          if (!it) continue;
          const chip = document.createElement("div");
          chip.style.padding = "4px 8px";
          chip.style.borderRadius = "999px";
          chip.style.border = "1px solid rgba(24,181,213,.25)";
          chip.style.background = "rgba(24,181,213,.08)";
          chip.style.color = "rgba(255,255,255,.90)";
          chip.style.fontSize = "11px";
          chip.style.fontWeight = "950";
          chip.style.lineHeight = "1";
          chip.style.direction = "ltr";
          chip.textContent = "." + it.toUpperCase();
          chips.appendChild(chip);
        }
        row.appendChild(chips);
      }

      p.appendChild(row);
    }

    const note = String((hintPopover && hintPopover.note) || "").trim();
    if (note) {
      const n = document.createElement("div");
      n.style.marginTop = sections.length ? "10px" : "0";
      n.style.color = "rgba(255,255,255,.55)";
      n.style.fontSize = "11px";
      n.style.fontWeight = "900";
      n.textContent = note;
      p.appendChild(n);
    }

    p.addEventListener("mouseenter", () => {
      try {
        clearCloseTimer();
      } catch {}
    });
    p.addEventListener("mouseleave", () => {
      try {
        clearCloseTimer();
        closeTimer = setTimeout(() => closePopover(), 140);
      } catch {}
    });

    p.addEventListener("mousedown", (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    });

    return p;
  };
  const onDocDown = (e) => {
    try {
      if (!pop) return;
      const t = e && e.target ? e.target : null;
      if (t && (t === pop || (pop && pop.contains(t)) || (infoBtn && (t === infoBtn || infoBtn.contains(t))))) return;
      closePopover();
    } catch {}
  };
  const onKeyDown = (e) => {
    try {
      const k = String((e && e.key) || "");
      if (k === "Escape") closePopover();
    } catch {}
  };
  const openPopover = () => {
    try {
      if (!hintPopover || disabled) return;
      if (pop) return;
      pop = buildPopover();
      document.body.appendChild(pop);
      positionPopover();
      try {
        requestAnimationFrame(() => {
          try {
            if (!pop) return;
            pop.style.opacity = "1";
            pop.style.transform = "translateY(0)";
          } catch {}
        });
      } catch {}
      try {
        document.addEventListener("mousedown", onDocDown, true);
      } catch {}
      try {
        document.addEventListener("keydown", onKeyDown, true);
      } catch {}
      try {
        window.addEventListener("scroll", closePopover, true);
      } catch {}
      try {
        window.addEventListener("resize", positionPopover, true);
      } catch {}
    } catch {}
  };

  let infoBtn = null;
  if (hintPopover) {
    infoBtn = document.createElement("button");
    infoBtn.type = "button";
    infoBtn.setAttribute("aria-label", isArabic() ? "تفاصيل الصيغ المتاحة" : "Allowed formats details");
    infoBtn.style.border = "1px solid rgba(255,255,255,.14)";
    infoBtn.style.background = "rgba(255,255,255,.06)";
    infoBtn.style.color = "rgba(255,255,255,.80)";
    infoBtn.style.width = "18px";
    infoBtn.style.height = "18px";
    infoBtn.style.borderRadius = "999px";
    infoBtn.style.display = "grid";
    infoBtn.style.placeItems = "center";
    infoBtn.style.fontSize = "12px";
    infoBtn.style.fontWeight = "950";
    infoBtn.style.lineHeight = "1";
    infoBtn.style.cursor = disabled ? "not-allowed" : "help";
    infoBtn.style.opacity = disabled ? "0.55" : "1";
    infoBtn.textContent = "i";

    infoBtn.addEventListener("mousedown", (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    });
    infoBtn.addEventListener("click", (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        if (pop) closePopover();
        else openPopover();
      } catch {}
    });
    infoBtn.addEventListener("mouseenter", (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        clearCloseTimer();
        openPopover();
      } catch {}
    });
    infoBtn.addEventListener("mouseleave", () => {
      try {
        clearCloseTimer();
        closeTimer = setTimeout(() => closePopover(), 140);
      } catch {}
    });

    t2.appendChild(infoBtn);
  }

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

  const onDrag = (ev) => {
    try {
      if (disabled) return;
      ev.preventDefault();
      ev.stopPropagation();
    } catch {}
  };
  z.addEventListener("dragenter", (ev) => {
    onDrag(ev);
    try {
      if (disabled) return;
      z.style.borderColor = "rgba(24,181,213,.5)";
      z.style.background = "#373737";
    } catch {}
  });
  z.addEventListener("dragover", (ev) => {
    onDrag(ev);
    try {
      if (disabled) return;
      z.style.borderColor = "rgba(24,181,213,.5)";
      z.style.background = "#373737";
    } catch {}
  });
  z.addEventListener("dragleave", (ev) => {
    onDrag(ev);
    try {
      if (disabled) return;
      z.style.borderColor = "rgba(255,255,255,.12)";
      z.style.background = "#373737";
    } catch {}
  });
  z.addEventListener("drop", (ev) => {
    try {
      if (disabled) return;
      ev.preventDefault();
      ev.stopPropagation();
      z.style.borderColor = "rgba(255,255,255,.12)";
      z.style.background = "#373737";
      emit(ev.dataTransfer && ev.dataTransfer.files ? ev.dataTransfer.files : []);
    } catch {}
  });

  z.appendChild(icon);
  z.appendChild(t1);
  z.appendChild(t2);
  return z;
};
`,
  `
const renderEmpty = () => {
  const wrap = document.createElement("div");
  wrap.style.border = "1px dashed rgba(255,255,255,.14)";
  wrap.style.borderRadius = "14px";
  wrap.style.padding = "16px";
  wrap.style.background = "#373737";
  wrap.style.color = "rgba(255,255,255,.72)";
  wrap.style.fontSize = "13px";
  wrap.style.fontWeight = "900";
  wrap.textContent = isArabic()
    ? "مفيش ملفات مرفوعة لحد دلوقتي. ارفع من (رفع الملفات) أو اضغط/حوّل وبعدين ارفع النتيجة."
    : "No files yet. Upload from Upload Center, or compress/convert then upload the result.";
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
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.placeItems = "center";
  wrap.style.flex = "1 1 auto";
  wrap.style.minHeight = "0";
  wrap.style.height = "100%";
  wrap.style.width = "100%";
  wrap.style.padding = "24px";

  const spinner = document.createElement("salla-loading");
  try {
    spinner.setAttribute("size", "68");
    spinner.setAttribute("width", "5");
    spinner.setAttribute("color", "#18b5d5");
    spinner.setAttribute("bg-color", "rgba(255,255,255,.08)");
  } catch {}
  wrap.appendChild(spinner);
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
const renderLinkBlock = (url, opts) => {
  const u = String(url || "");
  if (!u) return null;
  const o = opts && typeof opts === "object" ? opts : {};
  const compact = Boolean(o.compact);
  const labelText = String(o.label || "").trim() || (isArabic() ? "رابط الملف" : "File link");
  const metaText = String(o.meta || "").trim();
  const host = (() => {
    try {
      const parsed = new URL(u);
      return String(parsed.hostname || "").trim();
    } catch {
      return "";
    }
  })();

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = compact ? "0" : "8px";
  wrap.style.padding = compact ? "0" : "12px";
  wrap.style.borderRadius = compact ? "0" : "14px";
  wrap.style.border = compact ? "0" : "1px solid rgba(24,181,213,.35)";
  wrap.style.background = compact ? "transparent" : "#373737";

  if (compact) {
    const a = document.createElement("a");
    a.href = u;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = u;
    a.style.display = "block";
    a.style.direction = "ltr";
    a.style.textAlign = "left";
    a.style.fontSize = "10px";
    a.style.fontWeight = "900";
    a.style.color = "#18b5d5";
    a.style.textDecoration = "none";
    a.style.whiteSpace = "nowrap";
    a.style.overflow = "hidden";
    a.style.textOverflow = "ellipsis";
    wrap.appendChild(a);
    return wrap;
  }

  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.justifyContent = "space-between";
  head.style.gap = "8px";

  const label = document.createElement("div");
  label.style.fontSize = compact ? "11px" : "12px";
  label.style.fontWeight = "900";
  label.style.color = "rgba(255,255,255,.75)";
  label.textContent = labelText;

  const hostChip = document.createElement("div");
  hostChip.style.display = host ? "inline-flex" : "none";
  hostChip.style.alignItems = "center";
  hostChip.style.justifyContent = "center";
  hostChip.style.padding = compact ? "3px 6px" : "4px 8px";
  hostChip.style.borderRadius = "999px";
  hostChip.style.border = "1px solid rgba(255,255,255,.12)";
  hostChip.style.background = "rgba(255,255,255,.06)";
  hostChip.style.color = "rgba(255,255,255,.82)";
  hostChip.style.fontSize = compact ? "10px" : "11px";
  hostChip.style.fontWeight = "950";
  hostChip.style.lineHeight = "1";
  hostChip.textContent = host;

  head.appendChild(label);
  head.appendChild(hostChip);

  if (metaText) {
    const meta = document.createElement("div");
    meta.style.fontSize = compact ? "10px" : "11px";
    meta.style.fontWeight = "900";
    meta.style.color = "rgba(255,255,255,.7)";
    meta.textContent = metaText;
    wrap.appendChild(meta);
  }

  const linkBox = document.createElement("div");
  linkBox.style.border = "1px solid rgba(255,255,255,.10)";
  linkBox.style.borderRadius = "12px";
  linkBox.style.background = "#303030";
  linkBox.style.padding = compact ? "8px 10px" : "10px 12px";

  const a = document.createElement("a");
  a.href = u;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = u;
  a.style.display = "block";
  a.style.wordBreak = "break-word";
  a.style.direction = "ltr";
  a.style.textAlign = "left";
  a.style.fontSize = compact ? "12px" : "15px";
  a.style.fontWeight = "950";
  a.style.color = "#18b5d5";
  a.style.textDecoration = "underline";
  a.style.textDecorationThickness = compact ? "1px" : "2px";
  a.style.textUnderlineOffset = compact ? "2px" : "3px";
  if (compact) {
    a.style.whiteSpace = "nowrap";
    a.style.overflow = "hidden";
    a.style.textOverflow = "ellipsis";
  }

  linkBox.appendChild(a);

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.flexWrap = "wrap";
  actions.style.gap = "8px";
  actions.style.justifyContent = isArabic() ? "flex-start" : "flex-end";

  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = isArabic() ? "انسخ الرابط" : "Copy link";
  copy.style.border = "0";
  copy.style.cursor = "pointer";
  copy.style.padding = "10px 14px";
  copy.style.borderRadius = "10px";
  copy.style.background = "#18b5d5";
  copy.style.color = "#303030";
  copy.style.fontSize = "13px";
  copy.style.fontWeight = "950";
  copy.onclick = () => {
    try {
      const prev = isArabic() ? "انسخ الرابط" : "Copy link";
      copyText(u, (done) => {
        copy.textContent = done ? (isArabic() ? "تم النسخ" : "Copied") : prev;
      });
    } catch {}
  };

  const open = document.createElement("a");
  open.href = u;
  open.target = "_blank";
  open.rel = "noopener";
  open.textContent = isArabic() ? "فتح الرابط" : "Open link";
  open.style.display = "inline-flex";
  open.style.alignItems = "center";
  open.style.justifyContent = "center";
  open.style.padding = "10px 14px";
  open.style.borderRadius = "10px";
  open.style.border = "1px solid rgba(255,255,255,.14)";
  open.style.background = "#303030";
  open.style.color = "#fff";
  open.style.fontSize = "13px";
  open.style.fontWeight = "950";
  open.style.textDecoration = "none";

  actions.appendChild(copy);
  actions.appendChild(open);

  wrap.appendChild(head);
  wrap.appendChild(linkBox);
  if (!compact) wrap.appendChild(actions);
  return wrap;
};
`
];
